import "dotenv/config";

import cors from "cors";
import express from "express";

import { errorHandler } from "./middlewares/error-handler";
import { routes } from "./routes";

export const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
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
