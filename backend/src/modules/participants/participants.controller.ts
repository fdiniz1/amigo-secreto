import { Request, Response } from "express";

import { participantsService } from "./participants.service";

type ParticipantInput = {
  name: string;
  email: string;
};

function parseId(id: string): number | null {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return null;
  }

  return parsedId;
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function parseParticipantBody(body: unknown): ParticipantInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { name, email } = body as { name?: unknown; email?: unknown };

  if (typeof name !== "string" || typeof email !== "string") {
    return null;
  }

  const trimmedName = normalizeName(name);
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedName || !trimmedEmail) {
    return null;
  }

  return {
    name: trimmedName,
    email: trimmedEmail,
  };
}

export const participantsController = {
  async list(_request: Request, response: Response) {
    const participants = await participantsService.list();

    return response.json(participants);
  },

  async findById(request: Request, response: Response) {
    const id = parseId(request.params.id);

    if (!id) {
      return response.status(400).json({
        message: "ID do participante inválido.",
      });
    }

    const participant = await participantsService.findById(id);

    if (!participant) {
      return response.status(404).json({
        message: "Participante não encontrado.",
      });
    }

    return response.json(participant);
  },

  async create(request: Request, response: Response) {
    const data = parseParticipantBody(request.body);

    if (!data) {
      return response.status(400).json({
        message: "Nome e e-mail são obrigatórios.",
      });
    }

    const existingParticipant = await participantsService.findByEmail(data.email);

    if (existingParticipant) {
      return response.status(400).json({
        message: "Já existe um participante com este e-mail.",
      });
    }

    const participantWithSameName = await participantsService.findByName(data.name);

    if (participantWithSameName) {
      return response.status(400).json({
        message: "Já existe um participante com este nome.",
      });
    }

    const participant = await participantsService.create(data);

    return response.status(201).json(participant);
  },

  async update(request: Request, response: Response) {
    const id = parseId(request.params.id);

    if (!id) {
      return response.status(400).json({
        message: "ID do participante inválido.",
      });
    }

    const data = parseParticipantBody(request.body);

    if (!data) {
      return response.status(400).json({
        message: "Nome e e-mail são obrigatórios.",
      });
    }

    const existingParticipant = await participantsService.findById(id);

    if (!existingParticipant) {
      return response.status(404).json({
        message: "Participante não encontrado.",
      });
    }

    if (data.email !== existingParticipant.email) {
      const participantWithSameEmail = await participantsService.findByEmail(data.email);

      if (participantWithSameEmail) {
        return response.status(400).json({
          message: "Já existe um participante com este e-mail.",
        });
      }
    }

    const participantWithSameName = await participantsService.findByName(data.name);

    if (participantWithSameName && participantWithSameName.id !== id) {
      return response.status(400).json({
        message: "Já existe um participante com este nome.",
      });
    }

    const updatedParticipant = await participantsService.update(id, data);

    return response.json(updatedParticipant);
  },

  async remove(request: Request, response: Response) {
    const id = parseId(request.params.id);

    if (!id) {
      return response.status(400).json({
        message: "ID do participante inválido.",
      });
    }

    const existingParticipant = await participantsService.findById(id);

    if (!existingParticipant) {
      return response.status(404).json({
        message: "Participante não encontrado.",
      });
    }

    await participantsService.remove(id);

    return response.status(204).send();
  },

  async clearAll(_request: Request, response: Response) {
    await participantsService.clearAll();

    return response.status(204).send();
  },
};
