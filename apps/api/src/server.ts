import { loadServerEnv } from "@karate/config";
import { createLogger } from "@karate/logger";
import { prisma } from "@karate/database";
import { createApp } from "./app";

const env = loadServerEnv();
const logger = createLogger({ serviceName: "karate-api", environment: env.NODE_ENV, level: env.LOG_LEVEL });
const app = createApp(env, logger);

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, "karate-api listening");
});

async function shutdown(signal: string) {
  logger.info({ signal }, "shutting down");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  // Force-exit if graceful shutdown hangs.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ err: reason }, "unhandled promise rejection");
});
process.on("uncaughtException", (err) => {
  logger.error({ err }, "uncaught exception");
  process.exit(1);
});
