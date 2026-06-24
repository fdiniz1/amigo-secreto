import { prisma } from "../../lib/prisma";

export type ParticipantInput = {
  name: string;
  email: string;
};

export const participantsService = {
  list() {
    return prisma.participant.findMany({
      orderBy: {
        name: "asc",
      },
    });
  },

  findById(id: number) {
    return prisma.participant.findUnique({
      where: {
        id,
      },
    });
  },

  findByEmail(email: string) {
    return prisma.participant.findUnique({
      where: {
        email,
      },
    });
  },

  findByName(name: string) {
    return prisma.participant.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
  },

  create(data: ParticipantInput) {
    return prisma.participant.create({
      data,
    });
  },

  update(id: number, data: ParticipantInput) {
    return prisma.participant.update({
      where: {
        id,
      },
      data,
    });
  },

  remove(id: number) {
    return prisma.participant.delete({
      where: {
        id,
      },
    });
  },

  clearAll() {
    return prisma.participant.deleteMany();
  },
};
