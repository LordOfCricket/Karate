import type { Request, Response } from "express";
import type { ApiSuccessResponse } from "@karate/types";
import { asyncHandler } from "../../errors/asyncHandler";
import * as tournamentsService from "./tournaments.service";

export const transitionStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { tournamentId } = req.params as unknown as { tournamentId: string };
  const result = await tournamentsService.transitionTournamentStatus(tournamentId, req.user!.id, req.body);
  const body: ApiSuccessResponse<typeof result> = {
    success: true,
    data: result,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  };
  res.status(200).json(body);
});
