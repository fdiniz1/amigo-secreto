import "dotenv/config";

import cors from "cors";
import express from "express";

import { errorHandler } from "./middlewares/error-handler";
import { routes } from "./routes";

export const app = express();

function getAllowedOrigins() {
  const configuredOrigins = [process.env.FRONTEND_URLS, process.env.FRONTEND_URL]
    .filter(Boolean)
    .flatMap((value) => value?.split(",") ?? [])
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins.length > 0) {
    return configuredOrigins;
  }

  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(null, false);
    },
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  return response.json({
    status: "ok",
    service: "amigo-secreto-backend",
  });
});

app.use("/api", routes);
app.use(errorHandler);
