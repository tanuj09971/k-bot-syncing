/*
  Warnings:

  - You are about to drop the column `pongEmitted` on the `Ping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ping" DROP COLUMN "pongEmitted",
ADD COLUMN     "isPongEmitted" BOOLEAN NOT NULL DEFAULT false;

-- DropEnum
DROP TYPE "PongStatus";
