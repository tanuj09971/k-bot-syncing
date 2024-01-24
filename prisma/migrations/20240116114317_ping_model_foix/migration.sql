/*
  Warnings:

  - You are about to drop the column `timestamp` on the `Ping` table. All the data in the column will be lost.
  - Added the required column `event` to the `Ping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pongEmitted` to the `Ping` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Ping" DROP COLUMN "timestamp",
ADD COLUMN     "event" TEXT NOT NULL,
ADD COLUMN     "pongEmitted" BOOLEAN NOT NULL;
