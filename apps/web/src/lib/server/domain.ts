import { cookies } from "next/headers";
import { ACCESS_TOKEN_COOKIE_NAME } from "@karate/constants";
import { callBackend } from "./backend-client";

interface AcademySummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface CoachProfile {
  id: string;
  displayName: string;
  bio: string | null;
  yearsActive: number | null;
  status: string;
  styles: { id: string; name: string }[];
}

export interface PlayerProfile {
  id: string;
  displayName: string;
  status: string;
  primaryStyle: { id: string; name: string } | null;
}

export interface ScorerProfile {
  id: string;
  displayName: string;
  certificationLevel: string | null;
  status: string;
  verificationStatus: string;
}

export interface MembershipRow {
  id: string;
  status: string;
  academy: AcademySummary;
  startedAt: string | null;
  endedAt: string | null;
}

export interface PendingRequestRow {
  id: string;
  academy: { id: string; name: string; slug: string };
  message: string | null;
  createdAt: string;
}

export interface MyAcademy {
  id: string;
  name: string;
  slug: string;
  status: string;
  adminRole: string;
  playerCount?: number;
  coachCount?: number;
}

export interface IncomingRequestRow {
  id: string;
  targetType: "PLAYER" | "COACH";
  message: string | null;
  createdAt: string;
  applicant: { id: string; displayName: string } | null;
}

function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}

/** Every fetcher here fails soft (null/empty) rather than throwing — a missing profile or
 * empty list is a normal, renderable dashboard state, not an error. Auth failures are already
 * handled upstream by middleware + getCurrentUserOrRedirect. */
async function fetchOrNull<T>(path: string): Promise<T | null> {
  const accessToken = getAccessToken();
  if (!accessToken) return null;
  const result = await callBackend<T>(path, { accessToken });
  return result.body.success ? result.body.data : null;
}

async function fetchOrEmpty<T>(path: string): Promise<T[]> {
  return (await fetchOrNull<T[]>(path)) ?? [];
}

export const getCoachProfile = () => fetchOrNull<CoachProfile>("/api/v1/coaches/me");
export const getCoachAffiliations = () => fetchOrEmpty<MembershipRow>("/api/v1/coaches/me/affiliations");
export const getCoachPendingRequests = () => fetchOrEmpty<PendingRequestRow>("/api/v1/coaches/me/requests");

export const getPlayerProfile = () => fetchOrNull<PlayerProfile>("/api/v1/players/me");
export const getPlayerMemberships = () => fetchOrEmpty<MembershipRow>("/api/v1/players/me/memberships");
export const getPlayerPendingRequests = () => fetchOrEmpty<PendingRequestRow>("/api/v1/players/me/requests");

export const getScorerProfile = () => fetchOrNull<ScorerProfile>("/api/v1/scorers/me");

export const getMyAcademies = () => fetchOrEmpty<MyAcademy>("/api/v1/academies/mine");
export const getAcademyPendingRequests = (academyId: string) =>
  fetchOrEmpty<IncomingRequestRow>(`/api/v1/academies/${academyId}/membership-requests`);

export interface AcademySearchResult {
  id: string;
  name: string;
  city: string | null;
  countryCode: string | null;
}

export interface AcademyDetail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string | null;
  countryCode: string | null;
  status: string;
  playerCount: number;
  coachCount: number;
}

/** Public detail lookup — no access token required. */
export async function getAcademyById(academyId: string): Promise<AcademyDetail | null> {
  const result = await callBackend<AcademyDetail>(`/api/v1/academies/${academyId}`);
  return result.body.success ? result.body.data : null;
}

/** Public search — no access token required, matches the backend's unauthenticated GET /academies. */
export async function searchAcademies(query: string): Promise<AcademySearchResult[]> {
  if (!query.trim()) return [];
  const result = await callBackend<{ items: AcademySearchResult[] }>(
    `/api/v1/academies?q=${encodeURIComponent(query)}&pageSize=10`,
  );
  return result.body.success ? result.body.data.items : [];
}

// ---- Belt & grading domain ----

export interface BeltGradeRef {
  id: string;
  name: string;
  type: string;
  rankOrder: number;
  colorName: string | null;
  colorHex: string | null;
}

export interface CertificateRef {
  id: string;
  serialNumber: string;
  verificationCode: string;
  verificationStatus: string;
  issuedAt: string;
}

export interface BeltHistoryEntry {
  id: string;
  beltGrade: BeltGradeRef;
  verificationStatus: string;
  awardedDate: string;
  isCurrent: boolean;
  certificate: CertificateRef | null;
}

export interface BeltHistoryResponse {
  current: BeltHistoryEntry | null;
  history: BeltHistoryEntry[];
}

export const getMyBeltHistory = () => fetchOrNull<BeltHistoryResponse>("/api/v1/players/me/belt-history");

export interface StudentGrade {
  playerId: string;
  displayName: string;
  currentGrade: { name: string; verificationStatus: string } | null;
}

export const getMyStudentsGrades = () => fetchOrEmpty<StudentGrade>("/api/v1/coaches/me/students-grades");

export interface BeltSystemRef {
  id: string;
  karateStyleId: string;
  name: string;
  description: string | null;
}

export async function getBeltSystems(): Promise<BeltSystemRef[]> {
  const result = await callBackend<BeltSystemRef[]>("/api/v1/grading/belt-systems");
  return result.body.success ? result.body.data : [];
}

export const getBeltGrades = async (beltSystemId: string): Promise<BeltGradeRef[]> => {
  const result = await callBackend<BeltGradeRef[]>(`/api/v1/grading/belt-systems/${beltSystemId}/grades`);
  return result.body.success ? result.body.data : [];
};

export interface GradingEventRow {
  id: string;
  name: string;
  beltSystemId: string;
  status: string;
  eventDate: string;
  location: string | null;
}

export const getAcademyGradingEvents = (academyId: string) =>
  fetchOrEmpty<GradingEventRow>(`/api/v1/academies/${academyId}/grading-events`);

export interface GradingParticipantRow {
  id: string;
  result: string;
  remarks: string | null;
  player: { id: string; displayName: string };
  previousGrade: { id: string; name: string; rankOrder: number } | null;
  targetGrade: { id: string; name: string; rankOrder: number };
}

export interface GradingEventDetail extends GradingEventRow {
  participants: GradingParticipantRow[];
}

export const getGradingEventDetail = (eventId: string) =>
  fetchOrNull<GradingEventDetail>(`/api/v1/grading-events/${eventId}`);

export const getAcademyActivePlayers = (academyId: string) =>
  fetchOrEmpty<{ id: string; displayName: string }>(`/api/v1/academies/${academyId}/players`);

export interface PendingVerificationRow {
  id: string;
  awardedDate: string;
  beltGrade: { name: string };
  player: { id: string; displayName: string };
}

export const getAcademyPendingVerifications = (academyId: string) =>
  fetchOrEmpty<PendingVerificationRow>(`/api/v1/academies/${academyId}/pending-verifications`);

// ---- Tournament registration domain ----

export interface TournamentSummary {
  id: string;
  name: string;
  slug: string;
  venue: string | null;
  countryCode: string | null;
  status: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  startDate: string | null;
  endDate: string | null;
}

export interface CategoryRef {
  id: string;
  name: string;
  genderRestriction: string;
  ageMin: number | null;
  ageMax: number | null;
  weightMinKg: string | null;
  weightMaxKg: string | null;
}

export interface CompetitionRef {
  id: string;
  discipline: string;
  name: string;
  category: CategoryRef;
}

export interface TournamentDetail extends TournamentSummary {
  description: string | null;
  competitions: CompetitionRef[];
}

/** Public browse — no access token required, matches the backend's unauthenticated GET /tournaments. */
export async function listOpenTournaments(): Promise<TournamentSummary[]> {
  const result = await callBackend<{ items: TournamentSummary[] }>(
    "/api/v1/tournaments?status=REGISTRATION_OPEN&pageSize=50",
  );
  return result.body.success ? result.body.data.items : [];
}

export async function getTournamentDetail(tournamentId: string): Promise<TournamentDetail | null> {
  const result = await callBackend<TournamentDetail>(`/api/v1/tournaments/${tournamentId}`);
  return result.body.success ? result.body.data : null;
}

export interface RegistrationRow {
  id: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  player: { id: string; displayName: string };
  representingAcademy: { id: string; name: string; slug: string } | null;
  beltGradeAtRegistration: { id: string; name: string; type: string; rankOrder: number } | null;
  eligibility: { status: string; reasonCodes: string[] };
  medical: { status: string; expiresAt: string | null; isValid: boolean };
  weighIn: { status: string; measuredWeightKg: number | null; measuredAt: string | null };
  readiness: { status: "READY" | "NOT_READY"; blockedBy: string[] };
  competition: {
    id: string;
    discipline: string;
    name: string;
    tournament: { id: string; name: string; slug: string; status: string };
    category: CategoryRef;
  };
}

export interface WeighInAttemptRow {
  id: string;
  attemptNumber: number;
  measuredWeightKg: number | null;
  unit: string;
  status: string;
  reason: string | null;
  measuredAt: string;
}

export const getWeighInHistory = (registrationId: string) =>
  fetchOrEmpty<WeighInAttemptRow>(`/api/v1/registrations/${registrationId}/weigh-in`);

export const getMyRegistrations = () => fetchOrEmpty<RegistrationRow>("/api/v1/registrations/me");
export const getRegistration = (registrationId: string) =>
  fetchOrNull<RegistrationRow>(`/api/v1/registrations/${registrationId}`);
export const getMyStudentsRegistrations = () =>
  fetchOrEmpty<RegistrationRow>("/api/v1/coaches/me/students-registrations");
export const getAcademyRegistrations = (academyId: string) =>
  fetchOrEmpty<RegistrationRow>(`/api/v1/academies/${academyId}/registrations`);
