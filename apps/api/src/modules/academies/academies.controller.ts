import type { Request, Response } from "express";
import { ValidationError } from "@karate/shared";
import { asyncHandler } from "../../errors/asyncHandler";
import * as academiesService from "./academies.service";

export const createAcademyHandler = asyncHandler(async (req: Request, res: Response) => {
  const academy = await academiesService.createAcademy(req.user!.id, req.body);
  res.status(201).json({
    success: true,
    data: academy,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  });
});

export const resolveMembershipRequestHandler = asyncHandler(async (req: Request, res: Response) => {
  const academyId = req.params["academyId"];
  if (!academyId) {
    throw new ValidationError("Missing academyId route parameter.");
  }
  const result = await academiesService.resolveMembershipRequest(academyId, req.user!.id, req.body);
  res.status(200).json({
    success: true,
    data: result,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  });
});
