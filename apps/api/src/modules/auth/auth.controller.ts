import type { Request, Response } from "express";
import type { ApiSuccessResponse } from "@karate/types";
import { asyncHandler } from "../../errors/asyncHandler";
import * as authService from "./auth.service";

export const registerHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  const body: ApiSuccessResponse<typeof result> = {
    success: true,
    data: result,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  };
  res.status(201).json(body);
});

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  const body: ApiSuccessResponse<typeof result> = {
    success: true,
    data: result,
    meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
  };
  res.status(200).json(body);
});
