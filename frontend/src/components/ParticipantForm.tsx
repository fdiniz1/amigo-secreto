import React, { useState } from "react";

type ParticipantFormData = {
  name: string;
  email: string;
};

interface ParticipantFormProps {
  onSubmit: (data: ParticipantFormData) => Promise<void>;
}

export function ParticipantForm({ onSubmit }: ParticipantFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setFormError("Nome e e-mail são obrigatórios.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      setFormError("Informe um e-mail válido.");
      return;
    }

    setLoading(true);

    try {
      await onSubmit({
        name: trimmedName,
        email: trimmedEmail,
      });

      setName("");
      setEmail("");
    } catch (error: any) {
      setFormError(error.message || "Ocorreu um erro ao salvar o participante.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="form-container">
      <h3>➕ Adicionar participante</h3>

      <form onSubmit={handleSubmit} className="participant-form">
        <div className="form-group">
          <label htmlFor="participant-name">Nome</label>
          <input
            id="participant-name"
            type="text"
            placeholder="Nome do participante"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="participant-email">E-mail</label>
          <input
            id="participant-email"
            type="email"
            placeholder="exemplo@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={loading}
            required
          />
        </div>

        {formError && <div className="error-message">{formError}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Salvando..." : "Adicionar"}
          </button>
        </div>
      </form>
    </div>
  );
}