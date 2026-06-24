import React from "react";
import { DrawResponse } from "../services/draw";

interface DrawSuccessCardProps {
  drawResult: DrawResponse;
  onNewDrawRequest: () => void;
  loading: boolean;
}

export function DrawSuccessCard({
  drawResult,
  onNewDrawRequest,
  loading,
}: DrawSuccessCardProps) {
  const formattedDate = new Date(drawResult.draw.createdAt).toLocaleString("pt-BR");

  return (
    <section className="celebration-container">
      <span className="celebration-icon" role="img" aria-label="Sorteio concluído">
        🎉
      </span>

      <h1 className="celebration-title">Sorteio concluído!</h1>

      <p className="celebration-subtitle">
        O sorteio foi realizado com sucesso e os participantes já receberam o resultado por e-mail.
      </p>

      {drawResult.emailError && (
        <div className="celebration-warning" role="alert">
          <strong>
            O sorteio foi concluído, mas houve um problema no envio de alguns e-mails.
          </strong>
          <p>{drawResult.emailError}</p>
        </div>
      )}

      <div className="celebration-details">
        <h2 className="celebration-details-title">Detalhes da rodada</h2>

        <ul className="celebration-details-list">
          <li>
            <span>Código do sorteio</span>
            <strong>#{drawResult.draw.id}</strong>
          </li>
          <li>
            <span>Participantes</span>
            <strong>{drawResult.draw.totalParticipants} pessoas</strong>
          </li>
          <li>
            <span>Data e hora</span>
            <strong>{formattedDate}</strong>
          </li>
        </ul>
      </div>

      <button
        type="button"
        className="btn-new-game"
        onClick={onNewDrawRequest}
        disabled={loading}
      >
        {loading ? "Preparando novo sorteio..." : "Iniciar novo amigo secreto"}
      </button>
    </section>
  );
}