import { z } from "zod";
import { TOURNAMENT_STATUSES } from "@karate/types";
import { uuidSchema } from "./academy";

export const tournamentIdParamsSchema = z.object({
  tournamentId: uuidSchema,
});
export type TournamentIdParams = z.infer<typeof tournamentIdParamsSchema>;

export const transitionTournamentStatusSchema = z.object({
  status: z.enum(TOURNAMENT_STATUSES),
  reason: z.string().trim().min(1).max(500).optional(),
});
export type TransitionTournamentStatusRequest = z.infer<typeof transitionTournamentStatusSchema>;
