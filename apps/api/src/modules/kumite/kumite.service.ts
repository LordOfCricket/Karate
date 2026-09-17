import { prisma } from "@karate/database";
import type { OfficialFunction } from "@karate/types";
import { AuthorizationError, ConflictError, NotFoundError, ValidationError } from "@karate/shared";
import {
  aggregateJudgeSignals,
  computeKumiteState,
  computeWinner,
  nextPenaltyLevel,
  pointsForScoreType,
  type HanteiVote,
  type JudgeSignal,
  type KumiteConfig,
  type RawKumiteEvent,
} from "../../domain/kumiteEngine";
import { applyBoutResult } from "../bouts/bouts.service";
import { recordAudit } from "../../lib/audit";

const DEFAULT_CONFIG: KumiteConfig = {
  yukoPoints: 1,
  wazaAriPoints: 2,
  ipponPoints: 3,
  clearLeadPoints: 8,
  senshuEnabled: true,
  chuiLimit: 3,
};

/** Art. 12.2.8-9 — the infraction types that can strip an already-awarded SENSHU. */
const SENSHU_FORFEITING_CODES = ["AVOIDING_COMBAT", "JOGAI", "CLINCHING_OR_WRESTLING", "GRABBING_VIOLATION"];

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
}

const BOUT_INCLUDE = {
  round: {
    select: {
      draw: {
        select: {
          competitionId: true,
          competition: { select: { tournamentId: true, ruleSetVersionId: true, categoryId: true } },
        },
      },
    },
  },
  boutSchedules: { where: { schedule: { isActive: true } }, select: { tatami: { select: { id: true } } } },
  scoreEvents: { orderBy: { recordedAt: "asc" as const } },
} as const;

type KumiteBout = NonNullable<Awaited<ReturnType<typeof loadBoutForKumite>>>;

async function loadBoutForKumite(boutId: string) {
  const bout = await prisma.bout.findUnique({ where: { id: boutId }, include: BOUT_INCLUDE });
  if (!bout) {
    throw new NotFoundError("Bout", boutId);
  }
  return bout;
}

function assertBoutHasTwoParticipants(bout: KumiteBout): asserts bout is KumiteBout & { redPlayerId: string; bluePlayerId: string } {
  if (!bout.redPlayerId || !bout.bluePlayerId) {
    throw new ConflictError("This bout has a bye or an undecided slot and has no Kumite state.");
  }
}

function assertBoutIsActive(bout: KumiteBout) {
  if (bout.status !== "IN_PROGRESS" && bout.status !== "PAUSED") {
    throw new ConflictError(`This bout is ${bout.status} and cannot record Kumite scoring actions.`);
  }
}

async function getConfig(ruleSetVersionId: string | null): Promise<KumiteConfig> {
  if (!ruleSetVersionId) return DEFAULT_CONFIG;
  const config = await prisma.kumiteConfiguration.findUnique({ where: { ruleSetVersionId } });
  if (!config) return DEFAULT_CONFIG;
  return config;
}

/**
 * Resolves and validates that `actorUserId` holds an ASSIGNED/CONFIRMED
 * OfficialAssignment for one of `allowed` functions, scoped to this bout's
 * tournament and (if the assignment is scoped further) its competition/tatami.
 * Never trusts a client-supplied official function or assignment id.
 */
async function resolveOfficialAssignment(bout: KumiteBout, actorUserId: string, allowed: OfficialFunction[]) {
  const scorerProfile = await prisma.scorerProfile.findUnique({ where: { userId: actorUserId } });
  if (!scorerProfile) {
    throw new AuthorizationError("Only an assigned official can perform this action.");
  }
  const tournamentId = bout.round.draw.competition.tournamentId;
  const competitionId = bout.round.draw.competitionId;
  const tatamiId = bout.boutSchedules[0]?.tatami?.id ?? null;

  const assignments = await prisma.officialAssignment.findMany({
    where: {
      scorerProfileId: scorerProfile.id,
      tournamentId,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      function: { in: allowed },
    },
  });
  const match = assignments.find(
    (a) => (!a.competitionId || a.competitionId === competitionId) && (!a.tatamiId || a.tatamiId === tatamiId),
  );
  if (!match) {
    throw new AuthorizationError("You do not hold an applicable official function assignment for this bout.");
  }
  return match;
}

/** Every officialAssignmentId a client claims a signal came from must be a real, applicable JUDGE/REFEREE assignment for this bout. */
async function assertSignalsBelongToValidOfficials(bout: KumiteBout, signals: JudgeSignal[]) {
  const tournamentId = bout.round.draw.competition.tournamentId;
  const ids = [...new Set(signals.map((s) => s.officialAssignmentId))];
  const assignments = await prisma.officialAssignment.findMany({
    where: {
      id: { in: ids },
      tournamentId,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      function: { in: ["REFEREE", "JUDGE"] },
    },
  });
  if (assignments.length !== ids.length) {
    throw new ValidationError("One or more judge signals reference an official not assigned to this bout.");
  }
  for (const s of signals) {
    if (s.targetPlayerId !== bout.redPlayerId && s.targetPlayerId !== bout.bluePlayerId) {
      throw new ValidationError("A judge signal must target one of this bout's two participants.");
    }
  }
}

function toRawEvents(bout: KumiteBout): RawKumiteEvent[] {
  return bout.scoreEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    targetPlayerId: e.targetPlayerId,
    points: e.points ? Number(e.points) : null,
    reversesEventId: e.reversesEventId,
    recordedAt: e.recordedAt,
  }));
}

export async function getKumiteState(boutId: string) {
  const bout = await loadBoutForKumite(boutId);
  const config = await getConfig(bout.round.draw.competition.ruleSetVersionId);
  const state =
    bout.redPlayerId && bout.bluePlayerId
      ? computeKumiteState(toRawEvents(bout), bout.redPlayerId, bout.bluePlayerId, config)
      : null;

  const category = await prisma.category.findUnique({
    where: { id: bout.round.draw.competition.categoryId },
    select: { estimatedBoutDurationMinutes: true },
  });
  const durationSeconds = (category?.estimatedBoutDurationMinutes ?? 3) * 60;
  const elapsedNow =
    bout.clockElapsedSeconds +
    (bout.clockRunning && bout.clockLastStartedAt
      ? Math.floor((Date.now() - bout.clockLastStartedAt.getTime()) / 1000)
      : 0);

  return {
    boutId: bout.id,
    status: bout.status,
    redPlayerId: bout.redPlayerId,
    bluePlayerId: bout.bluePlayerId,
    state,
    clock: {
      durationSeconds,
      elapsedSeconds: Math.min(elapsedNow, durationSeconds),
      remainingSeconds: Math.max(durationSeconds - elapsedNow, 0),
      running: bout.clockRunning,
    },
    events: bout.scoreEvents.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      targetPlayerId: e.targetPlayerId,
      points: e.points ? Number(e.points) : null,
      reversesEventId: e.reversesEventId,
      recordedAt: e.recordedAt,
    })),
  };
}

export async function submitKumiteScore(
  boutId: string,
  actorUserId: string,
  input: { signals: JudgeSignal[]; clientOperationId: string },
) {
  const bout = await loadBoutForKumite(boutId);
  assertBoutHasTwoParticipants(bout);
  assertBoutIsActive(bout);
  await resolveOfficialAssignment(bout, actorUserId, ["REFEREE"]);
  await assertSignalsBelongToValidOfficials(bout, input.signals);

  const awarded = aggregateJudgeSignals(input.signals, bout.redPlayerId, bout.bluePlayerId);
  if (awarded.length === 0) {
    throw new ConflictError("No athlete reached the required two-judge scoring threshold (Art. 8.1/12.1.1).");
  }

  const config = await getConfig(bout.round.draw.competition.ruleSetVersionId);
  for (const score of awarded) {
    const key = score.targetPlayerId === bout.redPlayerId ? input.clientOperationId : `${input.clientOperationId}:2`;
    try {
      await prisma.scoreEvent.create({
        data: {
          boutId,
          discipline: "KUMITE",
          eventType: score.scoreType,
          targetPlayerId: score.targetPlayerId,
          points: pointsForScoreType(score.scoreType, config),
          clientOperationId: key,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  await recordAudit(actorUserId, "KUMITE_SCORE_AWARDED", "Bout", boutId, { awarded });
  return getKumiteState(boutId);
}

export async function cancelKumiteScore(
  boutId: string,
  actorUserId: string,
  input: { eventId: string; clientOperationId: string },
) {
  const bout = await loadBoutForKumite(boutId);
  assertBoutHasTwoParticipants(bout);
  assertBoutIsActive(bout);
  await resolveOfficialAssignment(bout, actorUserId, ["REFEREE"]);

  const original = bout.scoreEvents.find((e) => e.id === input.eventId);
  if (!original) {
    throw new NotFoundError("Score event", input.eventId);
  }
  if (!["YUKO", "WAZA_ARI", "IPPON"].includes(original.eventType)) {
    throw new ValidationError("Only an awarded score event can be cancelled.");
  }

  try {
    await prisma.scoreEvent.create({
      data: {
        boutId,
        discipline: "KUMITE",
        eventType: "SCORE_CANCELLED",
        targetPlayerId: original.targetPlayerId,
        reversesEventId: original.id,
        clientOperationId: input.clientOperationId,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }
  await recordAudit(actorUserId, "KUMITE_SCORE_CANCELLED", "Bout", boutId, { eventId: input.eventId });
  return getKumiteState(boutId);
}

export async function applyKumitePenalty(
  boutId: string,
  actorUserId: string,
  input: { targetPlayerId: string; penaltyType: "CHUI" | "HANSOKU_CHUI" | "HANSOKU" | "SHIKKAKU"; reasonCode: string; clientOperationId: string },
) {
  const bout = await loadBoutForKumite(boutId);
  assertBoutHasTwoParticipants(bout);
  assertBoutIsActive(bout);
  await resolveOfficialAssignment(bout, actorUserId, ["REFEREE"]);

  if (input.targetPlayerId !== bout.redPlayerId && input.targetPlayerId !== bout.bluePlayerId) {
    throw new ValidationError("A penalty must target one of this bout's two participants.");
  }

  const config = await getConfig(bout.round.draw.competition.ruleSetVersionId);
  const state = computeKumiteState(toRawEvents(bout), bout.redPlayerId, bout.bluePlayerId, config);
  const priorLevels = input.targetPlayerId === bout.redPlayerId ? state.redPenalties : state.bluePenalties;
  const actualLevel = nextPenaltyLevel(priorLevels, input.penaltyType, config);

  try {
    await prisma.scoreEvent.create({
      data: {
        boutId,
        discipline: "KUMITE",
        eventType: `PENALTY_${actualLevel}`,
        targetPlayerId: input.targetPlayerId,
        clientOperationId: input.clientOperationId,
      },
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
  }

  const holderIsTarget =
    (state.senshu === "RED" && input.targetPlayerId === bout.redPlayerId) ||
    (state.senshu === "BLUE" && input.targetPlayerId === bout.bluePlayerId);
  if (state.senshu && holderIsTarget && SENSHU_FORFEITING_CODES.includes(input.reasonCode)) {
    try {
      await prisma.scoreEvent.create({
        data: {
          boutId,
          discipline: "KUMITE",
          eventType: "SENSHU_ANNULLED",
          targetPlayerId: input.targetPlayerId,
          clientOperationId: `${input.clientOperationId}:senshu`,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }

  await recordAudit(actorUserId, "KUMITE_PENALTY_APPLIED", "Bout", boutId, {
    targetPlayerId: input.targetPlayerId,
    requested: input.penaltyType,
    applied: actualLevel,
    reasonCode: input.reasonCode,
  });
  return getKumiteState(boutId);
}

export async function submitHanteiVotes(
  boutId: string,
  actorUserId: string,
  input: { votes: HanteiVote[]; clientOperationId: string },
) {
  const bout = await loadBoutForKumite(boutId);
  assertBoutHasTwoParticipants(bout);
  await resolveOfficialAssignment(bout, actorUserId, ["REFEREE"]);

  const tournamentId = bout.round.draw.competition.tournamentId;
  const officialIds = input.votes.map((v) => v.officialAssignmentId);
  const validOfficials = await prisma.officialAssignment.findMany({
    where: {
      id: { in: officialIds },
      tournamentId,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      function: { in: ["REFEREE", "JUDGE"] },
    },
  });
  if (validOfficials.length !== officialIds.length) {
    throw new ValidationError("One or more HANTEI votes reference an official not assigned to this bout.");
  }
  for (const v of input.votes) {
    if (v.votedForPlayerId !== bout.redPlayerId && v.votedForPlayerId !== bout.bluePlayerId) {
      throw new ValidationError("A HANTEI vote must be for one of this bout's two participants.");
    }
  }

  for (const vote of input.votes) {
    try {
      await prisma.scoreEvent.create({
        data: {
          boutId,
          discipline: "KUMITE",
          eventType: "HANTEI_VOTE",
          targetPlayerId: vote.votedForPlayerId,
          officialAssignmentId: vote.officialAssignmentId,
          clientOperationId: `${input.clientOperationId}:${vote.officialAssignmentId}`,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) throw error;
    }
  }
  await recordAudit(actorUserId, "KUMITE_HANTEI_RECORDED", "Bout", boutId, { votes: input.votes });
  return getKumiteState(boutId);
}

function mapReasonToMethod(reasonCode: string): "POINTS" | "DISQUALIFICATION" | "NO_SHOW" | "DRAW" {
  if (reasonCode === "HANSOKU" || reasonCode === "SHIKKAKU") return "DISQUALIFICATION";
  if (reasonCode === "KIKEN") return "NO_SHOW";
  if (reasonCode === "HIKIWAKE") return "DRAW";
  return "POINTS";
}

export async function finalizeKumiteResult(
  boutId: string,
  actorUserId: string,
  input: {
    disqualifiedPlayerId?: string;
    disqualificationType?: "HANSOKU" | "SHIKKAKU" | "KIKEN";
    allowDraw?: boolean;
  },
) {
  const bout = await loadBoutForKumite(boutId);
  assertBoutHasTwoParticipants(bout);
  await resolveOfficialAssignment(bout, actorUserId, ["REFEREE"]);

  if (
    input.disqualifiedPlayerId &&
    input.disqualifiedPlayerId !== bout.redPlayerId &&
    input.disqualifiedPlayerId !== bout.bluePlayerId
  ) {
    throw new ValidationError("disqualifiedPlayerId must be one of this bout's two participants.");
  }

  const config = await getConfig(bout.round.draw.competition.ruleSetVersionId);
  const rawEvents = toRawEvents(bout);
  const state = computeKumiteState(rawEvents, bout.redPlayerId, bout.bluePlayerId, config);
  const hanteiVotes: HanteiVote[] = bout.scoreEvents
    .filter((e) => e.eventType === "HANTEI_VOTE" && e.officialAssignmentId && e.targetPlayerId)
    .map((e) => ({ officialAssignmentId: e.officialAssignmentId!, votedForPlayerId: e.targetPlayerId! }));

  const decision = computeWinner({
    state,
    redPlayerId: bout.redPlayerId,
    bluePlayerId: bout.bluePlayerId,
    disqualifiedPlayerId: input.disqualifiedPlayerId ?? null,
    disqualificationType: input.disqualificationType,
    timeUp: true,
    hanteiVotes,
    allowDraw: input.allowDraw ?? false,
  });

  if (decision.winnerPlayerId === null && decision.reasonCode === "HANTEI") {
    throw new ConflictError("This bout is tied with no superiority — submit HANTEI votes before finalizing.");
  }

  const result = await applyBoutResult(boutId, {
    method: mapReasonToMethod(decision.reasonCode),
    winnerPlayerId: decision.winnerPlayerId ?? undefined,
    finalScoreRed: state.redScore,
    finalScoreBlue: state.blueScore,
    reason: decision.reasonCode,
  });
  await recordAudit(actorUserId, "KUMITE_RESULT_FINALIZED", "Bout", boutId, {
    reasonCode: decision.reasonCode,
    winnerPlayerId: decision.winnerPlayerId,
  });
  return result;
}

async function assertClockActor(bout: KumiteBout, actorUserId: string) {
  await resolveOfficialAssignment(bout, actorUserId, ["REFEREE", "TIMEKEEPER"]);
}

export async function startKumiteClock(boutId: string, actorUserId: string) {
  const bout = await loadBoutForKumite(boutId);
  await assertClockActor(bout, actorUserId);
  if (bout.clockRunning) {
    throw new ConflictError("The clock is already running.");
  }
  await prisma.bout.update({ where: { id: boutId }, data: { clockRunning: true, clockLastStartedAt: new Date() } });
  await recordAudit(actorUserId, "KUMITE_CLOCK_STARTED", "Bout", boutId);
  return getKumiteState(boutId);
}

export async function pauseKumiteClock(boutId: string, actorUserId: string) {
  const bout = await loadBoutForKumite(boutId);
  await assertClockActor(bout, actorUserId);
  if (!bout.clockRunning || !bout.clockLastStartedAt) {
    throw new ConflictError("The clock is not running.");
  }
  const elapsed = bout.clockElapsedSeconds + Math.floor((Date.now() - bout.clockLastStartedAt.getTime()) / 1000);
  await prisma.bout.update({
    where: { id: boutId },
    data: { clockRunning: false, clockLastStartedAt: null, clockElapsedSeconds: elapsed },
  });
  await recordAudit(actorUserId, "KUMITE_CLOCK_PAUSED", "Bout", boutId);
  return getKumiteState(boutId);
}

export async function resumeKumiteClock(boutId: string, actorUserId: string) {
  return startKumiteClock(boutId, actorUserId);
}
