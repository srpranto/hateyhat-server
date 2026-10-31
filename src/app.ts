import express, { type Express } from "express";
import cors from "cors";
import { env } from "./env.js";
import { eventsRouter } from "./routes/events.js";
import { joinsRouter } from "./routes/joins.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  app.use(express.json());

  app.get("/", (_req, res) => {
    res.status(200).json({ message: "HateyHat API is running." });
  });

  app.use(eventsRouter);
  app.use(joinsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;

