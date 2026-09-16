export const HTTP_HEADER_REQUEST_ID = "x-request-id";

export const PAGINATION_DEFAULTS = {
  page: 1,
  pageSize: 20,
  maxPageSize: 100,
} as const;

export const AUTH_COOKIE_NAME = "karate_session";

export const PASSWORD_MIN_LENGTH = 12;

/** Rate limit defaults; environment-specific overrides live in @karate/config. */
export const RATE_LIMIT_DEFAULTS = {
  windowMs: 60_000,
  maxRequests: 100,
} as const;
