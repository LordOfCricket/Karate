"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ACCESS_TOKEN_COOKIE_NAME } from "@karate/constants";
import { callBackend } from "./backend-client";

export interface ActionResult {
  success: boolean;
  message?: string;
}

function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_TOKEN_COOKIE_NAME)?.value;
}

async function postAuthed(path: string, body: unknown): Promise<ActionResult> {
  const accessToken = getAccessToken();
  if (!accessToken) {
    return { success: false, message: "Your session has expired. Please sign in again." };
  }
  const result = await callBackend(path, { method: "POST", body, accessToken });
  return result.body.success ? { success: true } : { success: false, message: result.body.error.message };
}

export async function createPlayerProfileAction(input: {
  displayName: string;
  dateOfBirth: string;
  gender: "MALE" | "FEMALE";
}): Promise<ActionResult> {
  const result = await postAuthed("/api/v1/players/profile", input);
  if (result.success) revalidatePath("/dashboard/player");
  return result;
}

export async function createCoachProfileAction(input: { displayName: string }): Promise<ActionResult> {
  const result = await postAuthed("/api/v1/coaches/profile", input);
  if (result.success) revalidatePath("/dashboard/coach");
  return result;
}

export async function createScorerProfileAction(input: { displayName: string }): Promise<ActionResult> {
  const result = await postAuthed("/api/v1/scorers/profile", input);
  if (result.success) revalidatePath("/dashboard/scorer");
  return result;
}

export async function createAcademyAction(input: { name: string }): Promise<ActionResult> {
  const result = await postAuthed("/api/v1/academies", input);
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}

export async function requestToJoinAcademyAction(academyId: string): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/academies/${academyId}/membership-requests`, {});
  if (result.success) {
    revalidatePath("/dashboard/player");
    revalidatePath("/dashboard/coach");
  }
  return result;
}

export async function resolveMembershipRequestAction(
  academyId: string,
  requestId: string,
  action: "ACCEPT" | "REJECT",
): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/academies/${academyId}/membership-requests/resolve`, {
    requestId,
    action,
  });
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}

// ---- Belt & grading domain ----

export async function createGradingEventAction(
  academyId: string,
  input: { name: string; beltSystemId: string; eventDate: string },
): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/academies/${academyId}/grading-events`, input);
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}

export async function transitionGradingEventStatusAction(
  academyId: string,
  eventId: string,
  status: string,
): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/academies/${academyId}/grading-events/${eventId}/status`, {
    status,
  });
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}

export async function addGradingParticipantAction(
  academyId: string,
  eventId: string,
  input: { playerId: string; targetGradeId: string },
): Promise<ActionResult> {
  const result = await postAuthed(
    `/api/v1/academies/${academyId}/grading-events/${eventId}/participants`,
    input,
  );
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}

export async function recordGradingResultAction(
  academyId: string,
  eventId: string,
  participantId: string,
  result_: "PASS" | "FAIL" | "ABSENT" | "WITHHELD",
): Promise<ActionResult> {
  const result = await postAuthed(
    `/api/v1/academies/${academyId}/grading-events/${eventId}/participants/${participantId}/result`,
    { result: result_ },
  );
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}

// ---- Tournament registration ----

export async function createRegistrationAction(competitionId: string): Promise<ActionResult> {
  const result = await postAuthed("/api/v1/registrations", { competitionId });
  if (result.success) {
    revalidatePath("/dashboard/player/tournaments");
    revalidatePath("/dashboard/coach/tournaments");
    revalidatePath("/dashboard/academy/tournaments");
  }
  return result;
}

export async function withdrawRegistrationAction(registrationId: string): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/registrations/${registrationId}/withdraw`, {});
  if (result.success) {
    revalidatePath("/dashboard/player/tournaments");
    revalidatePath("/dashboard/coach/tournaments");
    revalidatePath("/dashboard/academy/tournaments");
  }
  return result;
}

export async function reevaluateEligibilityAction(registrationId: string): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/registrations/${registrationId}/eligibility/re-evaluate`, {});
  if (result.success) {
    revalidatePath("/dashboard/player/tournaments");
    revalidatePath("/dashboard/coach/tournaments");
    revalidatePath("/dashboard/academy/tournaments");
  }
  return result;
}

export async function verifyBeltHistoryAction(
  historyId: string,
  verificationStatus: "VERIFIED" | "REJECTED",
): Promise<ActionResult> {
  const result = await postAuthed(`/api/v1/grading/belt-history/${historyId}/verify`, { verificationStatus });
  if (result.success) revalidatePath("/dashboard/academy");
  return result;
}
