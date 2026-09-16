/**
 * DEMO DATA — every value here is fictional, used only to give Phase 1
 * dashboard layouts something to render. It is not wired to the API yet.
 * Replace with real data fetching (see docs/architecture/web-architecture.md)
 * before this ships to real users.
 */

export const demoPlayerOverview = {
  name: "Aiko Tanaka",
  academy: "[DEMO] Riverside Dojo",
  currentBelt: "3rd Kyu (Brown)",
  upcomingBout: {
    tournament: "[DEMO] Spring Regional Open",
    round: "Quarterfinal",
    scheduledAt: "Today, 3:40 PM",
    tatami: "Tatami 2",
  },
  recentResult: { opponent: "[DEMO] M. Suzuki", outcome: "WIN", method: "IPPON" },
  stats: { bouts: 24, wins: 17, losses: 7, ranking: 12 },
};

export const demoCoachOverview = {
  name: "Kenji Yamada",
  studentsCompetingNow: [
    { name: "[DEMO] Aiko Tanaka", tournament: "[DEMO] Spring Regional Open", status: "LIVE" as const },
    { name: "[DEMO] Ren Okada", tournament: "[DEMO] Spring Regional Open", status: "UPCOMING" as const },
  ],
  stats: { studentCount: 18, studentWins: 41, studentLosses: 22, medalsWon: 9 },
};

export const demoAcademyOverview = {
  name: "[DEMO] Riverside Dojo",
  stats: { playerCount: 64, coachCount: 6, tournamentsHosted: 2, tournamentsParticipated: 11 },
  pendingMembershipRequests: 3,
};

export const demoScorerOverview = {
  name: "Haruto Sato",
  assignment: {
    tournament: "[DEMO] Spring Regional Open",
    tatami: "Tatami 2",
    function: "JUDGE" as const,
  },
  currentBout: {
    redPlayer: "[DEMO] Aiko Tanaka",
    bluePlayer: "[DEMO] M. Suzuki",
    status: "IN_PROGRESS" as const,
  },
  connectionState: "CONNECTED" as const,
};
