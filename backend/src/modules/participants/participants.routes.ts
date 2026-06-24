import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { participantsController } from "./participants.controller";

export const participantsRoutes = Router();

participantsRoutes.get("/", asyncHandler(participantsController.list));
participantsRoutes.get("/:id", asyncHandler(participantsController.findById));
participantsRoutes.post("/", asyncHandler(participantsController.create));
participantsRoutes.put("/:id", asyncHandler(participantsController.update));
participantsRoutes.delete("/", asyncHandler(participantsController.clearAll));
participantsRoutes.delete("/:id", asyncHandler(participantsController.remove));
