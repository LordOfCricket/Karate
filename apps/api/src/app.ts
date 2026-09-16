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
import { tournamentsRouter } from "./modules/tournaments/tournaments.routes";
import { playersRouter } from "./modules/players/players.routes";
import { coachesRouter } from "./modules/coaches/coaches.routes";
import { scorersRouter } from "./modules/scorers/scorers.routes";
import { beltSystemsRouter } from "./modules/grading/beltSystems.routes";
import { academyGradingEventsRouter, gradingEventsRouter } from "./modules/grading/gradingEvents.routes";
import { beltHistoryRouter, academyPendingVerificationsRouter } from "./modules/grading/beltHistory.routes";
import { certificatesRouter } from "./modules/grading/certificates.routes";
import {
  registrationsRouter,
  coachStudentsRegistrationsRouter,
  academyRegistrationsRouter,
} from "./modules/registrations/registrations.routes";

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
  app.use("/api/v1/tournaments", tournamentsRouter);
  app.use("/api/v1/players", playersRouter);
  app.use("/api/v1/coaches", coachesRouter);
  app.use("/api/v1/scorers", scorersRouter);
  app.use("/api/v1/grading/belt-systems", beltSystemsRouter);
  app.use("/api/v1/academies/:academyId/grading-events", academyGradingEventsRouter);
  app.use("/api/v1/grading-events", gradingEventsRouter);
  app.use("/api/v1/grading/belt-history", beltHistoryRouter);
  app.use("/api/v1/academies/:academyId/pending-verifications", academyPendingVerificationsRouter);
  app.use("/api/v1/grading/certificates", certificatesRouter);
  app.use("/api/v1/registrations", registrationsRouter);
  app.use("/api/v1/coaches/me/students-registrations", coachStudentsRegistrationsRouter);
  app.use("/api/v1/academies/:academyId/registrations", academyRegistrationsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
