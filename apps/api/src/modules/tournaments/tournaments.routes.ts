import { Router } from "express";
import { tournamentIdParamsSchema, transitionTournamentStatusSchema } from "@karate/validation";
import { authenticate } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { validate } from "../../middleware/validate";
import { transitionStatusHandler } from "./tournaments.controller";

export const tournamentsRouter = Router();

tournamentsRouter.patch(
  "/:tournamentId/status",
  authenticate,
  requireRole("ACADEMY"),
  validate(tournamentIdParamsSchema, "params"),
  validate(transitionTournamentStatusSchema),
  transitionStatusHandler,
);
