import { Participant } from "@prisma/client";

import { sendDrawEmails } from "../../lib/mail";
import { prisma } from "../../lib/prisma";

type ParticipantDrawPair = {
  giverParticipantId: number;
  receiverParticipantId: number;
};

type EmailPair = {
  giverName: string;
  giverEmail: string;
  receiverName: string;
};

export class DrawError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
  ) {
    super(message);
    this.name = "DrawError";
  }
}

function shuffleParticipants(participants: Participant[]) {
  const shuffled = [...participants];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function buildDrawPairs(participants: Participant[]): ParticipantDrawPair[] {
  const shuffledParticipants = shuffleParticipants(participants);

  return shuffledParticipants.map((giver, index) => {
    const receiver = shuffledParticipants[(index + 1) % shuffledParticipants.length];

    return {
      giverParticipantId: giver.id,
      receiverParticipantId: receiver.id,
    };
  });
}

function hasInvalidPairs(pairs: ParticipantDrawPair[], participantCount: number) {
  const givers = new Set(pairs.map((pair) => pair.giverParticipantId));
  const receivers = new Set(pairs.map((pair) => pair.receiverParticipantId));
  const hasSelfDraw = pairs.some(
    (pair) => pair.giverParticipantId === pair.receiverParticipantId,
  );

  return hasSelfDraw || givers.size !== participantCount || receivers.size !== participantCount;
}

function getNameParts(name: string) {
  return name.trim().split(/\s+/).filter(Boolean);
}

function getFirstNameKey(name: string) {
  const [firstName] = getNameParts(name);

  return firstName?.toLocaleLowerCase("pt-BR") ?? "";
}

function getDuplicatedFirstNameKeys(participants: Participant[]) {
  const firstNameCount = new Map<string, number>();

  for (const participant of participants) {
    const firstNameKey = getFirstNameKey(participant.name);

    if (!firstNameKey) {
      continue;
    }

    firstNameCount.set(firstNameKey, (firstNameCount.get(firstNameKey) ?? 0) + 1);
  }

  return new Set(
    [...firstNameCount.entries()]
      .filter(([, count]) => count > 1)
      .map(([firstNameKey]) => firstNameKey),
  );
}

function getEmailDisplayName(
  participant: Pick<Participant, "name">,
  duplicatedFirstNames: Set<string>,
) {
  const nameParts = getNameParts(participant.name);
  const [firstName, secondName] = nameParts;

  if (!firstName) {
    return participant.name;
  }

  if (duplicatedFirstNames.has(getFirstNameKey(participant.name)) && secondName) {
    return `${firstName} ${secondName}`;
  }

  return firstName;
}

export const drawService = {
  async run() {
    const participants = await prisma.participant.findMany({
      orderBy: {
        id: "asc",
      },
    });

    if (participants.length < 3) {
      throw new DrawError("Cadastre pelo menos 3 participantes para realizar o sorteio.");
    }

    const pairs = buildDrawPairs(participants);

    if (hasInvalidPairs(pairs, participants.length)) {
      throw new DrawError("Falha ao gerar um sorteio válido. Tente novamente.", 500);
    }

    const participantsMap = new Map(
      participants.map((participant) => [participant.id, participant]),
    );

    const duplicatedFirstNames = getDuplicatedFirstNameKeys(participants);

    const emailPairs: EmailPair[] = pairs.map((pair) => {
      const giver = participantsMap.get(pair.giverParticipantId);
      const receiver = participantsMap.get(pair.receiverParticipantId);

      if (!giver || !receiver) {
        throw new DrawError("Falha ao montar os dados do sorteio.", 500);
      }

      return {
        giverName: getEmailDisplayName(giver, duplicatedFirstNames),
        giverEmail: giver.email,
        receiverName: getEmailDisplayName(receiver, duplicatedFirstNames),
      };
    });

    try {
      const draw = await prisma.$transaction(async (transaction) => {
        const createdDraw = await transaction.draw.create({
          data: {},
        });

        const createdDrawParticipants = await Promise.all(
          participants.map((participant) =>
            transaction.drawParticipant.create({
              data: {
                drawId: createdDraw.id,
                name: participant.name,
                email: participant.email,
              },
            }),
          ),
        );

        const drawParticipantByOriginalParticipantId = new Map<number, number>();

        for (const participant of participants) {
          const drawParticipant = createdDrawParticipants.find(
            (item) => item.email.toLowerCase() === participant.email.toLowerCase(),
          );

          if (!drawParticipant) {
            throw new DrawError("Falha ao salvar os participantes do sorteio.", 500);
          }

          drawParticipantByOriginalParticipantId.set(participant.id, drawParticipant.id);
        }

        await transaction.drawResult.createMany({
          data: pairs.map((pair) => {
            const giverDrawParticipantId = drawParticipantByOriginalParticipantId.get(
              pair.giverParticipantId,
            );
            const receiverDrawParticipantId = drawParticipantByOriginalParticipantId.get(
              pair.receiverParticipantId,
            );

            if (!giverDrawParticipantId || !receiverDrawParticipantId) {
              throw new DrawError("Falha ao mapear participantes do sorteio.", 500);
            }

            return {
              drawId: createdDraw.id,
              giverParticipantId: giverDrawParticipantId,
              receiverParticipantId: receiverDrawParticipantId,
            };
          }),
        });

        return {
          id: createdDraw.id,
          createdAt: createdDraw.createdAt,
          totalParticipants: createdDrawParticipants.length,
        };
      });

      let emailError: string | null = null;

      try {
        await sendDrawEmails(emailPairs);
      } catch (error) {
        console.error("Falha ao enviar e-mails do sorteio", error);
        emailError = "O sorteio foi salvo, mas houve falha no envio dos e-mails.";
      }

      return {
        message: emailError
          ? "Sorteio realizado com sucesso, mas houve falha no envio dos e-mails."
          : "Sorteio realizado com sucesso.",
        emailError,
        draw,
      };
    } catch (error) {
      console.error("Failed to persist draw result", error);

      if (error instanceof DrawError) {
        throw error;
      }

      throw new DrawError("Falha ao salvar o sorteio. Tente novamente.", 500);
    }
  },
};