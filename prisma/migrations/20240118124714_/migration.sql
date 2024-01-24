/*
  Warnings:

  - A unique constraint covering the columns `[nonce]` on the table `Pong` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Pong_nonce_key" ON "Pong"("nonce");
