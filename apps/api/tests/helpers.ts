import { randomUUID } from "node:crypto";
import request from "supertest";
import { loadServerEnv } from "@karate/config";
import { createLogger } from "@karate/logger";
import { prisma } from "@karate/database";
import { createApp } from "../src/app";

export function buildTestApp() {
  const env = loadServerEnv();
  const logger = createLogger({ serviceName: "karate-api-test", environment: "test", level: "silent" });
  return createApp(env, logger);
}

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${randomUUID()}@example.test`;
}

const TEST_PASSWORD = "TestPassword1234";

/**
 * Registers a fresh user and returns its tokens. Deliberately does NOT also
 * call /login afterwards — register already returns a valid token pair, and
 * calling login too would create a second, independent refresh-session
 * family for the same user (a separate "device session", by design), which
 * would make session-lifecycle tests ambiguous about which family they're
 * asserting against. Dedicated login-flow tests call /login directly.
 */
export async function registerAndLogin(
  app: ReturnType<typeof buildTestApp>,
  role: "PLAYER" | "COACH" | "ACADEMY" | "SCORER",
) {
  const email = uniqueEmail(role.toLowerCase());

  const registerRes = await request(app)
    .post("/api/v1/auth/register")
    .send({ email, password: TEST_PASSWORD, fullName: `Test ${role}`, role });

  return {
    email,
    accessToken: registerRes.body.data.accessToken as string,
    refreshToken: registerRes.body.data.refreshToken as string,
    userId: registerRes.body.data.userId as string,
  };
}

/** Creates an academy administered by the given user, with a TournamentOrganizer, for tournament tests. */
export async function createAcademyWithOrganizer(ownerUserId: string) {
  const academy = await prisma.academy.create({
    data: {
      name: "Test Academy",
      slug: `test-academy-${randomUUID()}`,
      status: "ACTIVE",
      createdById: ownerUserId,
      administrators: { create: [{ userId: ownerUserId, role: "OWNER" }] },
    },
  });
  const organizer = await prisma.tournamentOrganizer.create({
    data: { organizerType: "ACADEMY", academyId: academy.id },
  });
  return { academy, organizer };
}

export async function createDraftTournament(organizerId: string, createdByUserId: string) {
  return prisma.tournament.create({
    data: {
      organizerId,
      name: "Test Tournament",
      slug: `test-tournament-${randomUUID()}`,
      status: "DRAFT",
      createdByUserId,
    },
  });
}
