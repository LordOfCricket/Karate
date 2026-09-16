import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@karate/database";
import type { LoginRequest, RegisterRequest } from "@karate/validation";
import type { UserRole } from "@karate/types";
import { AuthenticationError, ConflictError } from "@karate/shared";
import { loadServerEnv } from "@karate/config";

const BCRYPT_SALT_ROUNDS = 12;

interface AuthResult {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  accessToken: string;
  refreshToken: string;
}

function issueTokens(userId: string, roles: UserRole[]) {
  const env = loadServerEnv();
  const accessToken = jwt.sign({ sub: userId, roles }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL_SECONDS,
  });
  const refreshToken = jwt.sign({ sub: userId, roles, type: "refresh" }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL_SECONDS,
  });
  return { accessToken, refreshToken };
}

export async function register(input: RegisterRequest): Promise<AuthResult> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("An account with this email already exists.");
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      roles: { create: [{ role: input.role }] },
    },
    include: { roles: true },
  });

  const roles = user.roles.map((r) => r.role) as UserRole[];
  const tokens = issueTokens(user.id, roles);

  return { userId: user.id, email: user.email, fullName: user.fullName, roles, ...tokens };
}

export async function login(input: LoginRequest): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { roles: true } });

  // Constant-shape failure path: don't reveal whether the email exists.
  if (!user || !user.passwordHash) {
    throw new AuthenticationError("Invalid email or password.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new AuthenticationError("Invalid email or password.");
  }

  if (user.status !== "ACTIVE") {
    throw new AuthenticationError("This account is not active.");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const roles = user.roles.map((r) => r.role) as UserRole[];
  const tokens = issueTokens(user.id, roles);

  return { userId: user.id, email: user.email, fullName: user.fullName, roles, ...tokens };
}
