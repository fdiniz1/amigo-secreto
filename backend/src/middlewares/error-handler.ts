import { Prisma } from "@prisma/client";
import { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return response.status(409).json({
        message: "Participant email already exists.",
      });
    }

    if (error.code === "P2025") {
      return response.status(404).json({
        message: "Participant not found.",
      });
    }
  }

  console.error(error);

  return response.status(500).json({
    message: "Internal server error.",
  });
};
