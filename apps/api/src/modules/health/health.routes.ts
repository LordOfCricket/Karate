import { Router } from "express";
import { prisma } from "@karate/database";
import { asyncHandler } from "../../errors/asyncHandler";

export const healthRouter = Router();

healthRouter.get("/live", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "live" } });
});

healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ success: true, data: { status: "ready" } });
  }),
);
