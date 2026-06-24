import { Router } from "express";

import { asyncHandler } from "../../lib/async-handler";
import { drawController } from "./draw.controller";

export const drawRoutes = Router();

drawRoutes.post("/", asyncHandler(drawController.run));
