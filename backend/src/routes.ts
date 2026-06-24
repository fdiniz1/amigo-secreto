import { Router } from "express";

import { drawRoutes } from "./modules/draw/draw.routes";
import { participantsRoutes } from "./modules/participants/participants.routes";

export const routes = Router();

routes.get("/", (_request, response) => {
  return response.json({
    message: "Amigo Secreto API",
  });
});

routes.use("/participants", participantsRoutes);
routes.use("/draw", drawRoutes);
