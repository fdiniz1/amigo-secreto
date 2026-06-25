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
      <span className="celebration-icon" role="img" aria-label="Sorteio concluido">
        🎉
      </span>

      <h1 className="celebration-title">Sorteio concluido!</h1>

      <p className="celebration-subtitle">
        O sorteio foi salvo com sucesso. Os e-mails serao enviados em background quando
        o provedor estiver disponivel.
      </p>

      {drawResult.emailError && (
        <div className="celebration-warning" role="alert">
          <strong>
            O sorteio foi concluido, mas houve um problema no envio de alguns e-mails.
          </strong>
          <p>{drawResult.emailError}</p>
        </div>
      )}

      <div className="celebration-details">
        <h2 className="celebration-details-title">Detalhes da rodada</h2>

        <ul className="celebration-details-list">
          <li>
            <span>Codigo do sorteio</span>
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

      <div className="draw-pairs-section">
        <div className="draw-pairs-header">
          <h2>Pares sorteados</h2>
          <span>{drawResult.pairs.length} pares</span>
        </div>

        <ul className="draw-pairs-list">
          {drawResult.pairs.map((pair) => (
            <li
              className="draw-pair-item"
              key={`${pair.giverEmail}-${pair.receiverEmail}`}
            >
              <div className="draw-pair-person">
                <strong>{pair.giverName}</strong>
                <span>{pair.giverEmail}</span>
              </div>

              <span className="draw-pair-arrow" aria-hidden="true">
                &rarr;
              </span>

              <div className="draw-pair-person draw-pair-person-receiver">
                <strong>{pair.receiverName}</strong>
                <span>{pair.receiverEmail}</span>
              </div>
            </li>
          ))}
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
