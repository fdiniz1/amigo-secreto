import React from "react";

interface DrawLoadingModalProps {
  isOpen: boolean;
}

export function DrawLoadingModal({ isOpen }: DrawLoadingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content drawing-modal">
        <div className="drawing-animation-container">
          <span className="gift-box" role="img" aria-label="Presente">🎁</span>
          <p className="pulse-text">Embaralhando nomes...</p>
          <div className="spinner"></div>
          <p className="sub-text">Escolhendo o amigo secreto de cada um de forma hiper-confidencial...</p>
        </div>
      </div>
    </div>
  );
}
