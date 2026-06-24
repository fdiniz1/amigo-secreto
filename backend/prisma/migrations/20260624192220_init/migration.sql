-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draw" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawParticipant" (
    "id" SERIAL NOT NULL,
    "drawId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrawParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrawResult" (
    "id" SERIAL NOT NULL,
    "drawId" INTEGER NOT NULL,
    "giverParticipantId" INTEGER NOT NULL,
    "receiverParticipantId" INTEGER NOT NULL,

    CONSTRAINT "DrawResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Participant_email_key" ON "Participant"("email");

-- CreateIndex
CREATE INDEX "DrawParticipant_drawId_idx" ON "DrawParticipant"("drawId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawParticipant_drawId_email_key" ON "DrawParticipant"("drawId", "email");

-- CreateIndex
CREATE INDEX "DrawResult_drawId_idx" ON "DrawResult"("drawId");

-- CreateIndex
CREATE INDEX "DrawResult_giverParticipantId_idx" ON "DrawResult"("giverParticipantId");

-- CreateIndex
CREATE INDEX "DrawResult_receiverParticipantId_idx" ON "DrawResult"("receiverParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawResult_drawId_giverParticipantId_key" ON "DrawResult"("drawId", "giverParticipantId");

-- CreateIndex
CREATE UNIQUE INDEX "DrawResult_drawId_receiverParticipantId_key" ON "DrawResult"("drawId", "receiverParticipantId");

-- AddForeignKey
ALTER TABLE "DrawParticipant" ADD CONSTRAINT "DrawParticipant_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawResult" ADD CONSTRAINT "DrawResult_drawId_fkey" FOREIGN KEY ("drawId") REFERENCES "Draw"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawResult" ADD CONSTRAINT "DrawResult_giverParticipantId_fkey" FOREIGN KEY ("giverParticipantId") REFERENCES "DrawParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrawResult" ADD CONSTRAINT "DrawResult_receiverParticipantId_fkey" FOREIGN KEY ("receiverParticipantId") REFERENCES "DrawParticipant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
