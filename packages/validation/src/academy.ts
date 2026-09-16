import { z } from "zod";

export const uuidSchema = z.string().uuid();

export const createAcademyRequestSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional(),
  countryCode: z.string().length(2).optional(),
  city: z.string().trim().max(200).optional(),
});
export type CreateAcademyRequest = z.infer<typeof createAcademyRequestSchema>;

export const membershipRequestActionSchema = z.object({
  requestId: uuidSchema,
  action: z.enum(["ACCEPT", "REJECT"]),
});
export type MembershipRequestAction = z.infer<typeof membershipRequestActionSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
