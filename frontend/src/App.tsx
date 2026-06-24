import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";

import { ConfirmModal } from "./components/ConfirmModal";
import { DrawLoadingModal } from "./components/DrawLoadingModal";
import { DrawSuccessCard } from "./components/DrawSuccessCard";
import { EditParticipantModal } from "./components/EditParticipantModal";
import { ParticipantForm } from "./components/ParticipantForm";
import { ParticipantsList } from "./components/ParticipantsList";
import { DrawResponse, drawService } from "./services/draw";
import { Participant, participantsService } from "./services/participants";

type ParticipantFormData = {
  name: string;
  email: string;
};

function sortParticipantsByName(list: Participant[]) {
  return [...list].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export default function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [participantToDelete, setParticipantToDelete] = useState<Participant | null>(null);

  const [loading, setLoading] = useState(false);
  const [drawLoading, setDrawLoading] = useState(false);
  const [deletingParticipantId, setDeletingParticipantId] = useState<number | null>(null);

  const [drawResult, setDrawResult] = useState<DrawResponse | null>(null);
  const [drawError, setDrawError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  const isDrawDisabled = loading || drawLoading || participants.length < 3;

  useEffect(() => {
    void loadParticipants();
  }, []);

  async function loadParticipants() {
    setLoading(true);
    setErrorMessage("");

    try {
      const data = await participantsService.list();
      setParticipants(sortParticipantsByName(data));
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao carregar participantes.");
    } finally {
      setLoading(false);
    }
  }

  function clearDrawFeedback() {
    setDrawResult(null);
    setDrawError("");
  }

  function clearDeleteState() {
    setParticipantToDelete(null);
    setDeletingParticipantId(null);
  }

  function clearResetState() {
    setShowResetConfirmModal(false);
  }

  async function handleCreateParticipant(data: ParticipantFormData) {
    try {
      setErrorMessage("");

      const created = await participantsService.create(data);

      setParticipants((prev) => sortParticipantsByName([...prev, created]));
      clearDrawFeedback();
    } catch (error: any) {
      throw new Error(error.message || "Erro ao salvar participante.");
    }
  }

  async function handleUpdateParticipant(data: ParticipantFormData) {
    if (!editingParticipant) {
      return;
    }

    try {
      setErrorMessage("");

      const updated = await participantsService.update(editingParticipant.id, data);

      setParticipants((prev) =>
        sortParticipantsByName(
          prev.map((participant) =>
            participant.id === editingParticipant.id ? updated : participant,
          ),
        ),
      );

      setEditingParticipant(null);
      clearDrawFeedback();
    } catch (error: any) {
      throw new Error(error.message || "Erro ao salvar participante.");
    }
  }

  function handleEditSelect(participant: Participant) {
    setEditingParticipant(participant);
  }

  function handleCancelEditing() {
    setEditingParticipant(null);
  }

  function handleDeleteRequest(participant: Participant) {
    setParticipantToDelete(participant);
  }

  async function confirmDeleteParticipant() {
    if (!participantToDelete) return;

    setDeletingParticipantId(participantToDelete.id);
    setErrorMessage("");

    try {
      await participantsService.remove(participantToDelete.id);

      setParticipants((prev) =>
        prev.filter((participant) => participant.id !== participantToDelete.id),
      );

      if (editingParticipant?.id === participantToDelete.id) {
        setEditingParticipant(null);
      }

      clearDrawFeedback();
      clearDeleteState();
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao excluir participante.");
      setDeletingParticipantId(null);
    }
  }

  async function handleRunDraw() {
    clearDrawFeedback();
    setErrorMessage("");

    if (participants.length < 3) {
      setDrawError("Cadastre pelo menos 3 participantes para realizar o sorteio.");
      return;
    }

    setDrawLoading(true);

    try {
      const result = await drawService.run();
      setDrawResult(result);

      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
      });

      window.setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });

        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 200);
    } catch (error: any) {
      setDrawError(error.message || "Erro ao realizar sorteio.");
    } finally {
      setDrawLoading(false);
    }
  }

  function handleStartNewDraw() {
    setShowResetConfirmModal(true);
  }

  function handleCloseResetModal() {
    setShowResetConfirmModal(false);
  }

  async function confirmStartNewDraw() {
    setLoading(true);
    setErrorMessage("");

    try {
      await participantsService.clearAll();

      setParticipants([]);
      setDrawResult(null);
      setDrawError("");
      setEditingParticipant(null);
      clearDeleteState();
      clearResetState();
    } catch (error: any) {
      setErrorMessage(error.message || "Erro ao reiniciar o Amigo Secreto.");
    } finally {
      setLoading(false);
    }
  }

  if (drawResult) {
    return (
      <main className="app-shell">
        <DrawSuccessCard
          drawResult={drawResult}
          onNewDrawRequest={handleStartNewDraw}
          loading={loading}
        />

        <ConfirmModal
          isOpen={showResetConfirmModal}
          onClose={handleCloseResetModal}
          onConfirm={confirmStartNewDraw}
          title="Iniciar novo amigo secreto"
          message="Deseja realmente iniciar um novo amigo secreto? Isso apagará todos os participantes cadastrados atualmente para que você possa montar uma nova rodada."
          confirmText="Sim, reiniciar"
          cancelText="Cancelar"
          loading={loading}
          type="warning"
        />
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">Sorteio online</span>
          <h1>Amigo Secreto</h1>
          <p>Cadastre os participantes abaixo para dar início ao sorteio do Amigo Secreto.</p>
        </div>

        <button
          type="button"
          className="draw-cta-desktop"
          onClick={handleRunDraw}
          disabled={isDrawDisabled}
        >
          {drawLoading ? "Sorteando..." : "Realizar sorteio"}
        </button>
      </section>

      {errorMessage && <div className="global-error">{errorMessage}</div>}
      {drawError && <div className="global-error">{drawError}</div>}

      <div className="dashboard-grid">
        <section className="panel" aria-labelledby="form-section-title">
          <ParticipantForm onSubmit={handleCreateParticipant} />
        </section>

        <section className="panel" aria-labelledby="participants-title">
          <div className="panel-header">
            <div>
              <h2 id="participants-title">Participantes ({participants.length})</h2>
              <p>Gerencie as pessoas que farão parte do sorteio.</p>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">Carregando participantes...</div>
          ) : (
            <ParticipantsList
              participants={participants}
              onEdit={handleEditSelect}
              onDeleteRequest={handleDeleteRequest}
              deletingId={deletingParticipantId}
            />
          )}
        </section>
      </div>

      <div className="mobile-draw-bar">
        <button
          type="button"
          className="draw-cta-mobile"
          onClick={handleRunDraw}
          disabled={isDrawDisabled}
        >
          {drawLoading ? "Sorteando..." : "Realizar sorteio"}
        </button>
      </div>

      <EditParticipantModal
        isOpen={!!editingParticipant}
        participant={editingParticipant}
        onSubmit={handleUpdateParticipant}
        onClose={handleCancelEditing}
      />

      <ConfirmModal
        isOpen={!!participantToDelete}
        onClose={clearDeleteState}
        onConfirm={confirmDeleteParticipant}
        title="Excluir participante"
        message={
          participantToDelete
            ? `Tem certeza que deseja excluir o participante ${participantToDelete.name}? Esta ação não pode ser desfeita.`
            : ""
        }
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        loading={deletingParticipantId !== null}
        type="danger"
      />

      <DrawLoadingModal isOpen={drawLoading} />
    </main>
  );
}