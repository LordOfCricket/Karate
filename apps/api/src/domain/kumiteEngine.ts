import type { KumitePenaltyType, KumiteResultReason, KumiteScoreType } from "@karate/types";

/**
 * Pure, deterministic Kumite rule engine — driven by the verified WKF Kumite
 * Competition Rules, Version 2026.00, valid from 1 January 2026
 * (https://www.wkf.net/files/pdf/documents/WKF%20KUMITE%202026.pdf,
 * retrieved 2026-09-17). Article references below cite that document.
 *
 * No I/O here — apps/api/src/modules/kumite reads/writes ScoreEvent rows and
 * calls into these functions so the rule logic itself stays reproducible
 * from (events + config + votes) alone (see requirement: result reproducibility).
 */

export interface KumiteConfig {
  yukoPoints: number;
  wazaAriPoints: number;
  ipponPoints: number;
  clearLeadPoints: number;
  senshuEnabled: boolean;
  chuiLimit: number;
}

export function pointsForScoreType(type: KumiteScoreType, config: KumiteConfig): number {
  if (type === "YUKO") return config.yukoPoints;
  if (type === "WAZA_ARI") return config.wazaAriPoints;
  return config.ipponPoints;
}

export interface RawKumiteEvent {
  id: string;
  eventType: string;
  targetPlayerId: string | null;
  points: number | null;
  reversesEventId: string | null;
  recordedAt: Date;
}

export interface KumiteState {
  redScore: number;
  blueScore: number;
  redIppon: number;
  redWazaAri: number;
  redYuko: number;
  blueIppon: number;
  blueWazaAri: number;
  blueYuko: number;
  senshu: "RED" | "BLUE" | null;
  redPenalties: KumitePenaltyType[];
  bluePenalties: KumitePenaltyType[];
  clearLeadReached: "RED" | "BLUE" | null;
}

/** Art. 8.6 (scale), 12.1.2/12.1.3 (both/either athlete scoring), 12.2.1-2 (SENSHU), 7.7 (8-point clear lead). */
export function computeKumiteState(
  events: RawKumiteEvent[],
  redPlayerId: string,
  bluePlayerId: string,
  config: KumiteConfig,
): KumiteState {
  const reversed = new Set(
    events.filter((e) => e.eventType === "SCORE_CANCELLED" && e.reversesEventId).map((e) => e.reversesEventId),
  );
  const senshuAnnulled = events.some((e) => e.eventType === "SENSHU_ANNULLED");

  const sorted = [...events].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());

  let redScore = 0;
  let blueScore = 0;
  let redIppon = 0;
  let redWazaAri = 0;
  let redYuko = 0;
  let blueIppon = 0;
  let blueWazaAri = 0;
  let blueYuko = 0;
  let senshu: "RED" | "BLUE" | null = null;
  let clearLeadReached: "RED" | "BLUE" | null = null;
  const redPenalties: KumitePenaltyType[] = [];
  const bluePenalties: KumitePenaltyType[] = [];

  for (const e of sorted) {
    if (reversed.has(e.id)) continue;
    if (e.eventType.startsWith("PENALTY_")) {
      const level = e.eventType.replace("PENALTY_", "") as KumitePenaltyType;
      if (e.targetPlayerId === redPlayerId) redPenalties.push(level);
      else if (e.targetPlayerId === bluePlayerId) bluePenalties.push(level);
      continue;
    }
    if (e.eventType !== "YUKO" && e.eventType !== "WAZA_ARI" && e.eventType !== "IPPON") continue;

    const isRed = e.targetPlayerId === redPlayerId;
    const pts = e.points ?? pointsForScoreType(e.eventType, config);
    const beforeRed = redScore;
    const beforeBlue = blueScore;

    if (isRed) {
      redScore += pts;
      if (e.eventType === "IPPON") redIppon++;
      if (e.eventType === "WAZA_ARI") redWazaAri++;
      if (e.eventType === "YUKO") redYuko++;
    } else {
      blueScore += pts;
      if (e.eventType === "IPPON") blueIppon++;
      if (e.eventType === "WAZA_ARI") blueWazaAri++;
      if (e.eventType === "YUKO") blueYuko++;
    }

    if (config.senshuEnabled && senshu === null && beforeRed === 0 && beforeBlue === 0) {
      senshu = isRed ? "RED" : "BLUE";
    }

    if (clearLeadReached === null) {
      if (redScore - blueScore >= config.clearLeadPoints) clearLeadReached = "RED";
      else if (blueScore - redScore >= config.clearLeadPoints) clearLeadReached = "BLUE";
    }
  }

  if (senshuAnnulled) senshu = null;

  return {
    redScore,
    blueScore,
    redIppon,
    redWazaAri,
    redYuko,
    blueIppon,
    blueWazaAri,
    blueYuko,
    senshu,
    redPenalties,
    bluePenalties,
    clearLeadReached,
  };
}

/**
 * Art. 10.2/10.3 — the warning/penalty ladder. CHUI is capped at `chuiLimit`
 * (3); a further minor infraction escalates to HANSOKU_CHUI; a further
 * infraction after that escalates to HANSOKU. SHIKKAKU is always direct.
 * Once HANSOKU has been reached, further penalties stay at HANSOKU (already
 * disqualified from the bout).
 */
export function nextPenaltyLevel(
  priorLevels: KumitePenaltyType[],
  requested: KumitePenaltyType,
  config: KumiteConfig,
): KumitePenaltyType {
  if (requested === "SHIKKAKU") return "SHIKKAKU";
  if (priorLevels.includes("HANSOKU")) return "HANSOKU";
  if (requested === "HANSOKU") return "HANSOKU";
  const hasHansokuChui = priorLevels.includes("HANSOKU_CHUI");
  if (requested === "HANSOKU_CHUI") return hasHansokuChui ? "HANSOKU" : "HANSOKU_CHUI";
  // requested === "CHUI"
  if (hasHansokuChui) return "HANSOKU";
  const chuiCount = priorLevels.filter((l) => l === "CHUI").length;
  return chuiCount >= config.chuiLimit ? "HANSOKU_CHUI" : "CHUI";
}

export interface JudgeSignal {
  officialAssignmentId: string;
  targetPlayerId: string;
  scoreType: KumiteScoreType;
}

export interface AggregatedScore {
  targetPlayerId: string;
  scoreType: KumiteScoreType;
}

/**
 * Art. 8.1/12.1.1 — a score requires at least two Judges signalling it.
 * Art. 12.1.2 — both Athletes can score in the same exchange.
 * Art. 12.1.3 — differing judges for one Athlete: apply the higher score.
 * Art. 12.1.4 — a majority (plurality) of judges for one level overrules the
 * "apply the highest" default.
 */
export function aggregateJudgeSignals(
  signals: JudgeSignal[],
  redPlayerId: string,
  bluePlayerId: string,
): AggregatedScore[] {
  const results: AggregatedScore[] = [];
  const order: KumiteScoreType[] = ["IPPON", "WAZA_ARI", "YUKO"];

  for (const playerId of [redPlayerId, bluePlayerId]) {
    const forPlayer = signals.filter((s) => s.targetPlayerId === playerId);
    if (forPlayer.length < 2) continue;

    const counts: Record<KumiteScoreType, number> = { YUKO: 0, WAZA_ARI: 0, IPPON: 0 };
    for (const s of forPlayer) counts[s.scoreType]++;
    const maxCount = Math.max(counts.YUKO, counts.WAZA_ARI, counts.IPPON);
    const topLevels = order.filter((l) => counts[l] === maxCount && maxCount > 0);
    const chosen = topLevels.length === 1 ? topLevels[0]! : order.find((l) => topLevels.includes(l))!;
    results.push({ targetPlayerId: playerId, scoreType: chosen });
  }

  return results;
}

export interface HanteiVote {
  officialAssignmentId: string;
  votedForPlayerId: string;
}

/** Art. 12.2.4/12.2.7 — a final majority vote of the Referee + 4 Judges. Returns null on a tie (should not occur with 5 voters unless votes are incomplete/invalid). */
export function computeHanteiWinner(
  votes: HanteiVote[],
  redPlayerId: string,
  bluePlayerId: string,
): string | null {
  let red = 0;
  let blue = 0;
  for (const v of votes) {
    if (v.votedForPlayerId === redPlayerId) red++;
    else if (v.votedForPlayerId === bluePlayerId) blue++;
  }
  if (red === blue) return null;
  return red > blue ? redPlayerId : bluePlayerId;
}

export interface WinnerInput {
  state: KumiteState;
  redPlayerId: string;
  bluePlayerId: string;
  disqualifiedPlayerId?: string | null;
  disqualificationType?: "HANSOKU" | "SHIKKAKU" | "KIKEN";
  timeUp: boolean;
  hanteiVotes?: HanteiVote[];
  /** True only for Round-robin/Team bouts (Art. 12.2.5) — individual elimination bouts cannot end in a tie. */
  allowDraw: boolean;
}

export interface WinnerDecision {
  winnerPlayerId: string | null;
  reasonCode: KumiteResultReason;
}

/**
 * Deterministic result engine — Art. 7.7-7.9, 12.2.1-12.2.7. Given the same
 * state/votes/config it always returns the same decision (reproducibility).
 */
export function computeWinner(input: WinnerInput): WinnerDecision {
  const { state, redPlayerId, bluePlayerId, disqualifiedPlayerId, disqualificationType, timeUp, hanteiVotes, allowDraw } =
    input;

  if (disqualifiedPlayerId && disqualificationType) {
    const opponent = disqualifiedPlayerId === redPlayerId ? bluePlayerId : redPlayerId;
    return { winnerPlayerId: opponent, reasonCode: disqualificationType };
  }

  if (state.clearLeadReached === "RED") return { winnerPlayerId: redPlayerId, reasonCode: "CLEAR_LEAD" };
  if (state.clearLeadReached === "BLUE") return { winnerPlayerId: bluePlayerId, reasonCode: "CLEAR_LEAD" };

  if (!timeUp) {
    throw new Error("A winner can only be determined before time-up via a clear lead or a disqualification.");
  }

  if (state.redScore !== state.blueScore) {
    return {
      winnerPlayerId: state.redScore > state.blueScore ? redPlayerId : bluePlayerId,
      reasonCode: "TIMEUP_HIGHER_SCORE",
    };
  }

  if (state.senshu) {
    return { winnerPlayerId: state.senshu === "RED" ? redPlayerId : bluePlayerId, reasonCode: "SENSHU" };
  }

  if (state.redIppon !== state.blueIppon) {
    return { winnerPlayerId: state.redIppon > state.blueIppon ? redPlayerId : bluePlayerId, reasonCode: "IPPON_COUNT" };
  }
  if (state.redWazaAri !== state.blueWazaAri) {
    return {
      winnerPlayerId: state.redWazaAri > state.blueWazaAri ? redPlayerId : bluePlayerId,
      reasonCode: "WAZA_ARI_COUNT",
    };
  }

  if (hanteiVotes && hanteiVotes.length > 0) {
    const winner = computeHanteiWinner(hanteiVotes, redPlayerId, bluePlayerId);
    if (winner) return { winnerPlayerId: winner, reasonCode: "HANTEI" };
  }

  if (allowDraw) return { winnerPlayerId: null, reasonCode: "HIKIWAKE" };

  return { winnerPlayerId: null, reasonCode: "HANTEI" };
}
