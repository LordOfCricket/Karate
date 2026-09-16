import type { ApiResponse } from "@karate/types";
import type { LoginRequest, RegisterRequest } from "@karate/validation";
import { tokenStorage } from "./token-storage";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface CurrentUser extends AuthUser {
  status: string;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  withAuth?: boolean;
  /** Internal: set on the retry attempt so a failed refresh can't loop. Never pass this explicitly. */
  skipRefresh?: boolean;
}

/**
 * Refresh is shared across concurrent callers via one in-flight promise —
 * five screens hitting an expired access token at once triggers one
 * rotation, not five (which would otherwise race and only one could win,
 * per the backend's single-use rotation).
 */
let refreshInFlight: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const result = await request<AuthUser & AuthTokens>("/api/v1/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    await tokenStorage.save(result.accessToken, result.refreshToken);
    return true;
  } catch {
    // Expired, revoked, or reuse-detected — none of these are recoverable client-side.
    await tokenStorage.clear();
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function request<T>(path: string, init: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (init.withAuth) {
    const token = await tokenStorage.getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiRequestError("Unable to reach the server. Check your connection.", 0);
  }

  const payload = (await res.json()) as ApiResponse<T>;
  if (!payload.success) {
    if (res.status === 401 && init.withAuth && !init.skipRefresh) {
      const refreshed = await refreshOnce();
      if (refreshed) {
        return request<T>(path, { ...init, skipRefresh: true });
      }
    }
    throw new ApiRequestError(payload.error.message, res.status);
  }
  return payload.data;
}

/** Same backend contracts as web — no auth logic is reimplemented here, only transported. */
export const apiClient = {
  register: (input: RegisterRequest) =>
    request<AuthUser & AuthTokens>("/api/v1/auth/register", { method: "POST", body: input }),
  login: (input: LoginRequest) =>
    request<AuthUser & AuthTokens>("/api/v1/auth/login", { method: "POST", body: input }),
  me: () => request<CurrentUser>("/api/v1/auth/me", { withAuth: true }),
  logout: (refreshToken: string) =>
    request<{ loggedOut: true }>("/api/v1/auth/logout", { method: "POST", body: { refreshToken } }),
};
