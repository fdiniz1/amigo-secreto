import React, { useEffect, useState } from "react";

import { Participant } from "../services/participants";

type ParticipantFormData = {
  name: string;
  email: string;
};

interface EditParticipantModalProps {
  isOpen: boolean;
  participant: Participant | null;
  onSubmit: (data: ParticipantFormData) => Promise<void>;
  onClose: () => void;
}

export function EditParticipantModal({
  isOpen,
  participant,
  onSubmit,
  onClose,
}: EditParticipantModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!participant) {
      setName("");
      setEmail("");
      setFormError("");
      return;
    }

    setName(participant.name);
    setEmail(participant.email);
    setFormError("");
  }, [participant]);

  if (!isOpen || !participant) {
    return null;
  }

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
    } catch (error: any) {
      setFormError(error.message || "Ocorreu um erro ao salvar o participante.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} aria-hidden="true">
      <div
        className="modal-content edit-participant-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-participant-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          title="Fechar modal"
          disabled={loading}
        >
          &times;
        </button>

        <div className="modal-header">
          <h2 id="edit-participant-modal-title">Editar participante</h2>
          <p>Atualize os dados de {participant.name}.</p>
        </div>

        <form onSubmit={handleSubmit} className="participant-form">
          <div className="form-group">
            <label htmlFor="edit-participant-name">Nome</label>
            <input
              id="edit-participant-name"
              type="text"
              placeholder="Nome do participante"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-participant-email">E-mail</label>
            <input
              id="edit-participant-email"
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
              {loading ? "Salvando..." : "Atualizar"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}