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
      origin: (requestOrigin, callback) => {
        if (!requestOrigin) {
          callback(null, true);
          return;
        }
        const allowedOrigins = [
          env.CLIENT_URL,
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ];
        if (
          allowedOrigins.includes(requestOrigin) ||
          /^https:\/\/.*\.vercel\.app$/.test(requestOrigin)
        ) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
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

