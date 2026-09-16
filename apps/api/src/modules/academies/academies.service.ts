import { prisma } from "@karate/database";
import type { CreateAcademyRequest, MembershipRequestAction } from "@karate/validation";
import { ConflictError, NotFoundError } from "@karate/shared";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createAcademy(ownerUserId: string, input: CreateAcademyRequest) {
  const baseSlug = slugify(input.name);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  return prisma.academy.create({
    data: {
      name: input.name,
      slug,
      description: input.description,
      countryCode: input.countryCode,
      city: input.city,
      createdById: ownerUserId,
      administrators: { create: [{ userId: ownerUserId, role: "OWNER" }] },
    },
  });
}

/**
 * Accept/reject a pending coach or player membership request. On accept,
 * this creates the corresponding historical membership/affiliation row
 * rather than mutating anything in place, per the "membership history must
 * never be destroyed" requirement.
 */
export async function resolveMembershipRequest(
  academyId: string,
  respondingUserId: string,
  input: MembershipRequestAction,
) {
  const request = await prisma.academyMembershipRequest.findUnique({ where: { id: input.requestId } });
  if (!request || request.academyId !== academyId) {
    throw new NotFoundError("Membership request", input.requestId);
  }
  if (request.status !== "PENDING") {
    throw new ConflictError(`Membership request is already ${request.status}.`);
  }

  const newStatus = input.action === "ACCEPT" ? "ACCEPTED" : "REJECTED";

  return prisma.$transaction(async (tx) => {
    await tx.academyMembershipRequest.update({
      where: { id: request.id },
      data: { status: newStatus, respondedByUserId: respondingUserId, respondedAt: new Date() },
    });

    if (input.action === "REJECT") {
      return { request, membership: null };
    }

    if (request.targetType === "PLAYER" && request.playerId) {
      const membership = await tx.academyPlayerMembership.create({
        data: {
          academyId,
          playerId: request.playerId,
          status: "ACTIVE",
          respondedAt: new Date(),
          startedAt: new Date(),
        },
      });
      return { request, membership };
    }

    if (request.targetType === "COACH" && request.coachId) {
      const membership = await tx.academyCoachAffiliation.create({
        data: {
          academyId,
          coachId: request.coachId,
          status: "ACTIVE",
          respondedAt: new Date(),
          startedAt: new Date(),
        },
      });
      return { request, membership };
    }

    throw new ConflictError("Membership request is missing a target coach/player.");
  });
}
