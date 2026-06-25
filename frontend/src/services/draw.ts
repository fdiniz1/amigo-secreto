const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3333/api";

export interface DrawPair {
  giverName: string;
  giverEmail: string;
  receiverName: string;
  receiverEmail: string;
}

export interface DrawResponse {
  message: string;
  emailError: string | null;
  draw: {
    id: number;
    createdAt: string;
    totalParticipants: number;
  };
  pairs: DrawPair[];
}

async function parseResponse<T>(response: Response, defaultMessage: string): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || defaultMessage);
  }

  return response.json() as Promise<T>;
}

export const drawService = {
  async run(): Promise<DrawResponse> {
    const response = await fetch(`${API_BASE_URL}/draw`, {
      method: "POST",
    });

    return parseResponse<DrawResponse>(response, "Erro ao realizar sorteio.");
  },
};
