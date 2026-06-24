const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export interface Participant {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantPayload {
  name: string;
  email: string;
}

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || defaultMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const participantsService = {
  async list(): Promise<Participant[]> {
    const response = await fetch(`${API_BASE_URL}/participants`);
    return parseResponse<Participant[]>(response, "Erro ao listar participantes.");
  },

  async findById(id: number): Promise<Participant> {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`);
    return parseResponse<Participant>(response, "Erro ao buscar participante.");
  },

  async create(data: ParticipantPayload): Promise<Participant> {
    const response = await fetch(`${API_BASE_URL}/participants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return parseResponse<Participant>(response, "Erro ao criar participante.");
  },

  async update(id: number, data: ParticipantPayload): Promise<Participant> {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    return parseResponse<Participant>(response, "Erro ao atualizar participante.");
  },

  async remove(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/participants/${id}`, {
      method: "DELETE",
    });

    await parseResponse<void>(response, "Erro ao excluir participante.");
  },

  async clearAll(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/participants`, {
      method: "DELETE",
    });

    await parseResponse<void>(response, "Erro ao limpar participantes.");
  },
};