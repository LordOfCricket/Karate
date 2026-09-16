import { Router } from "express";
import { registerRequestSchema, loginRequestSchema } from "@karate/validation";
import { validate } from "../../middleware/validate";
import { rateLimit } from "../../middleware/rateLimit";
import { loginHandler, registerHandler } from "./auth.controller";

export const authRouter = Router();

authRouter.post("/register", validate(registerRequestSchema), registerHandler);
authRouter.post(
  "/login",
  rateLimit({ windowMs: 60_000, maxRequests: 10 }),
  validate(loginRequestSchema),
  loginHandler,
);
