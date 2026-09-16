import { Router } from "express";
import { createAcademyRequestSchema, membershipRequestActionSchema } from "@karate/validation";
import { authenticate } from "../../middleware/auth";
import { requireRole, requireAcademyAdministrator } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { createAcademyHandler, resolveMembershipRequestHandler } from "./academies.controller";

export const academiesRouter = Router();

academiesRouter.post(
  "/",
  authenticate,
  requireRole("ACADEMY"),
  validate(createAcademyRequestSchema),
  createAcademyHandler,
);

academiesRouter.post(
  "/:academyId/membership-requests/resolve",
  authenticate,
  requireAcademyAdministrator(),
  validate(membershipRequestActionSchema),
  resolveMembershipRequestHandler,
);
