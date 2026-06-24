import React from "react";

import { Participant } from "../services/participants";

interface ParticipantsListProps {
  participants: Participant[];
  onEdit: (participant: Participant) => void;
  onDeleteRequest: (participant: Participant) => void;
  deletingId?: number | null;
}

export function ParticipantsList({
  participants,
  onEdit,
  onDeleteRequest,
  deletingId = null,
}: ParticipantsListProps) {
  if (participants.length === 0) {
    return (
      <div className="empty-state">
        Nenhum participante adicionado ainda. Preencha o formulário ao lado para começar.
      </div>
    );
  }

  return (
    <div className="list-container">
      <table className="participants-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>E-mail</th>
            <th className="actions-header">Ações</th>
          </tr>
        </thead>

        <tbody>
          {participants.map((participant) => {
            const isDeleting = deletingId === participant.id;

            return (
              <tr key={participant.id}>
                <td className="name-cell">{participant.name}</td>
                <td className="email-cell">{participant.email}</td>
                <td className="actions-cell">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => onEdit(participant)}
                    title="Editar participante"
                    disabled={isDeleting || deletingId !== null}
                  >
                    ✏️ Editar
                  </button>

                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => onDeleteRequest(participant)}
                    title="Excluir participante"
                    disabled={isDeleting || deletingId !== null}
                  >
                    {isDeleting ? "Excluindo..." : "🗑️ Excluir"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}