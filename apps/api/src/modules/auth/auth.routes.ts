import { Router } from "express";
import {
  registerRequestSchema,
  loginRequestSchema,
  refreshRequestSchema,
  logoutRequestSchema,
} from "@karate/validation";
import { validate } from "../../middleware/validate";
import { rateLimit } from "../../middleware/rateLimit";
import { authenticate } from "../../middleware/auth";
import { loginHandler, registerHandler, meHandler, refreshHandler, logoutHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", validate(registerRequestSchema), registerHandler);
authRouter.post(
  "/login",
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(loginRequestSchema),
  loginHandler,
);
authRouter.get("/me", authenticate, meHandler);
authRouter.post(
  "/refresh",
  // Higher ceiling than login: legitimate clients refresh periodically in
  // the background, but this still bounds brute-force guessing of tokens
  // (infeasible anyway at 40 random bytes, but defense in depth is free).
  rateLimit({ windowMs: 60_000, maxRequests: 30 }),
  validate(refreshRequestSchema),
  refreshHandler,
);
authRouter.post("/logout", validate(logoutRequestSchema), logoutHandler);
