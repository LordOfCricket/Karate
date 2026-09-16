import { Router } from "express";
import { createPlayerProfileSchema, updatePlayerProfileSchema } from "@karate/validation";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import {
  createPlayerProfileHandler,
  getMyPlayerProfileHandler,
  updatePlayerProfileHandler,
  listMyMembershipsHandler,
  listMyPendingRequestsHandler,
} from "./players.controller";

export const playersRouter = Router();

playersRouter.use(authenticate, requireRole("PLAYER"));
playersRouter.get("/me", getMyPlayerProfileHandler);
playersRouter.post("/profile", validate(createPlayerProfileSchema), createPlayerProfileHandler);
playersRouter.patch("/profile", validate(updatePlayerProfileSchema), updatePlayerProfileHandler);
playersRouter.get("/me/memberships", listMyMembershipsHandler);
playersRouter.get("/me/requests", listMyPendingRequestsHandler);
