/**
 * Competition official functions. These are per-tournament/per-tatami
 * assignments held by a user with the SCORER role — never a login role
 * themselves. See docs/architecture/role-permission-model.md.
 */
export const OFFICIAL_FUNCTIONS = [
  "REFEREE",
  "JUDGE",
  "KANSA",
  "SCORE_SUPERVISOR",
  "TIMEKEEPER",
  "VIDEO_REVIEW_JUDGE",
  "TATAMI_MANAGER",
] as const;
export type OfficialFunction = (typeof OFFICIAL_FUNCTIONS)[number];

export const OFFICIAL_ASSIGNMENT_STATUSES = [
  "ASSIGNED",
  "CONFIRMED",
  "DECLINED",
  "COMPLETED",
  "REVOKED",
] as const;
export type OfficialAssignmentStatus = (typeof OFFICIAL_ASSIGNMENT_STATUSES)[number];
