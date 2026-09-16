import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import type { Logger } from "@karate/logger";
import { getCorsAllowedOrigins, type ServerEnv } from "@karate/config";
import { requestContext } from "./middleware/requestContext";
import { requestLogger } from "./middleware/requestLogger";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { errorHandler } from "./middleware/errorHandler";
import { authRouter } from "./modules/auth/auth.routes";
import { healthRouter } from "./modules/health/health.routes";
import { academiesRouter } from "./modules/academies/academies.routes";

export function createApp(env: ServerEnv, logger: Logger): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: getCorsAllowedOrigins(env), credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(requestContext(logger));
  app.use(requestLogger);

  app.use("/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/academies", academiesRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
