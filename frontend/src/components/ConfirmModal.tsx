import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: "danger" | "warning";
  closeOnOverlayClick?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  loading = false,
  type = "warning",
  closeOnOverlayClick = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const icon = type === "danger" ? "🛑" : "⚠️";
  const confirmButtonClassName =
    type === "danger" ? "btn-delete-confirm" : "btn-primary";

  const handleOverlayClick = () => {
    if (!closeOnOverlayClick || loading) return;
    onClose();
  };

  const handleConfirmClick = async () => {
    await onConfirm();
  };

  return (
    <div
      className="modal-overlay"
      onClick={handleOverlayClick}
      aria-hidden="true"
    >
      <div
        className="modal-content confirmation-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <button
          type="button"
          className="modal-close"
          onClick={onClose}
          title="Fechar modal"
          disabled={loading}
          aria-label="Fechar modal"
        >
          &times;
        </button>

        <div className="confirmation-body">
          <span
            className="warning-icon"
            role="img"
            aria-label={type === "danger" ? "Perigo" : "Aviso"}
          >
            {icon}
          </span>

          <h3 id="confirm-modal-title">{title}</h3>
          <p>{message}</p>

          <div className="form-actions confirmation-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {cancelText}
            </button>

            <button
              type="button"
              className={confirmButtonClassName}
              onClick={handleConfirmClick}
              disabled={loading}
            >
              {loading ? "Processando..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}