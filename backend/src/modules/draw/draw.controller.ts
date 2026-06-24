import { Request, Response } from "express";

import { DrawError, drawService } from "./draw.service";

export const drawController = {
  async run(_request: Request, response: Response) {
    try {
      const result = await drawService.run();

      return response.status(201).json(result);
    } catch (error) {
      if (error instanceof DrawError) {
        return response.status(error.statusCode).json({
          message: error.message,
        });
      }

      throw error;
    }
  },
};
