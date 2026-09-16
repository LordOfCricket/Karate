import { prisma } from "@karate/database";
import type { TransitionTournamentStatusRequest } from "@karate/validation";
import { AuthorizationError, NotFoundError } from "@karate/shared";
import { assertValidTournamentTransition } from "../../domain/tournamentLifecycle";

/**
 * Loads the tournament together with the organizer chain needed for
 * authorization. Kept as one query (not split into "load" + "authorize"
 * middleware) because the authorization check itself needs the tournament's
 * organizer->academy chain, which only exists once this row is fetched —
 * fetching it twice would be wasted work for no safety benefit.
 */
async function getTournamentWithOrganizer(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { organizer: { include: { academy: true } } },
  });
  if (!tournament) {
    throw new NotFoundError("Tournament", tournamentId);
  }
  return tournament;
}

/**
 * Organization-level authorization for tournament management, mirroring
 * `requireAcademyAdministrator` but reached through Tournament -> organizer
 * -> academy instead of a direct `:academyId` route param. A user's global
 * ACADEMY role claim is never sufficient on its own — this always checks a
 * concrete AcademyAdministrator row for the academy that actually organizes
 * this specific tournament.
 */
async function assertUserCanManageTournament(
  tournament: Awaited<ReturnType<typeof getTournamentWithOrganizer>>,
  userId: string,
): Promise<void> {
  const academyId = tournament.organizer.academyId;
  if (!academyId) {
    // Non-academy organizer types (FEDERATION/ASSOCIATION/OTHER) have no
    // authorization path implemented yet — see ADR-0001. Fail closed.
    throw new AuthorizationError("This tournament's organizer type does not support management yet.");
  }

  const membership = await prisma.academyAdministrator.findUnique({
    where: { academyId_userId: { academyId, userId } },
  });
  if (!membership) {
    throw new AuthorizationError("You do not administer this tournament's organizing academy.");
  }
}

export async function transitionTournamentStatus(
  tournamentId: string,
  userId: string,
  input: TransitionTournamentStatusRequest,
) {
  const tournament = await getTournamentWithOrganizer(tournamentId);
  await assertUserCanManageTournament(tournament, userId);
  assertValidTournamentTransition(tournament.status, input.status);

  return prisma.$transaction(async (tx) => {
    const updated = await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: input.status },
    });
    await tx.tournamentStatusHistory.create({
      data: {
        tournamentId,
        fromStatus: tournament.status,
        toStatus: input.status,
        changedByUserId: userId,
        reason: input.reason,
      },
    });
    return updated;
  });
}
