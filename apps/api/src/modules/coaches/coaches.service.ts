import { prisma } from "@karate/database";
import type { CreateCoachProfileRequest, UpdateCoachProfileRequest } from "@karate/validation";
import { ConflictError, NotFoundError } from "@karate/shared";

const PROFILE_INCLUDE = { styles: true } as const;

function findByUserId(userId: string) {
  return prisma.coachProfile.findUnique({ where: { userId }, include: PROFILE_INCLUDE });
}

type CoachProfileWithRelations = NonNullable<Awaited<ReturnType<typeof findByUserId>>>;

function toDto(profile: CoachProfileWithRelations) {
  return {
    id: profile.id,
    userId: profile.userId,
    displayName: profile.displayName,
    photoUrl: profile.photoUrl,
    bio: profile.bio,
    yearsActive: profile.yearsActive,
    status: profile.status,
    styles: profile.styles.map((s) => ({ id: s.id, name: s.name })),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function createProfile(userId: string, input: CreateCoachProfileRequest) {
  const existing = await findByUserId(userId);
  if (existing) {
    throw new ConflictError("A coach profile already exists for this account.");
  }

  const profile = await prisma.coachProfile.create({
    data: {
      userId,
      displayName: input.displayName,
      photoUrl: input.photoUrl,
      bio: input.bio,
      yearsActive: input.yearsActive,
      styles: input.styleIds ? { connect: input.styleIds.map((id) => ({ id })) } : undefined,
    },
    include: PROFILE_INCLUDE,
  });
  return toDto(profile);
}

export async function getMyProfile(userId: string) {
  const profile = await findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Coach profile");
  }
  return toDto(profile);
}

/** Academy affiliation history for the authenticated coach (all statuses, newest first). */
export async function listMyAffiliations(userId: string) {
  const profile = await findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Coach profile");
  }
  const affiliations = await prisma.academyCoachAffiliation.findMany({
    where: { coachId: profile.id },
    include: { academy: { select: { id: true, name: true, slug: true, logoUrl: true } } },
    orderBy: { requestedAt: "desc" },
  });
  return affiliations.map((a) => ({
    id: a.id,
    status: a.status,
    academy: a.academy,
    startedAt: a.startedAt,
    endedAt: a.endedAt,
    requestedAt: a.requestedAt,
  }));
}

/** Requests this coach has sent that are still awaiting an academy's decision. */
export async function listMyPendingRequests(userId: string) {
  const profile = await findByUserId(userId);
  if (!profile) {
    throw new NotFoundError("Coach profile");
  }
  const requests = await prisma.academyMembershipRequest.findMany({
    where: { coachId: profile.id, status: "PENDING" },
    include: { academy: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  });
  return requests.map((r) => ({ id: r.id, academy: r.academy, message: r.message, createdAt: r.createdAt }));
}

export async function updateProfile(userId: string, input: UpdateCoachProfileRequest) {
  const existing = await findByUserId(userId);
  if (!existing) {
    throw new NotFoundError("Coach profile");
  }

  const profile = await prisma.coachProfile.update({
    where: { userId },
    data: {
      displayName: input.displayName,
      photoUrl: input.photoUrl,
      bio: input.bio,
      yearsActive: input.yearsActive,
      styles: input.styleIds ? { set: input.styleIds.map((id) => ({ id })) } : undefined,
    },
    include: PROFILE_INCLUDE,
  });
  return toDto(profile);
}
