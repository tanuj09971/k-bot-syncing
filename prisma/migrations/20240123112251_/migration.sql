/*
  Warnings:

  - You are about to drop the column `isPongEmitted` on the `Ping` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ping" DROP COLUMN "isPongEmitted",
ADD COLUMN     "isPongProcessed" BOOLEAN NOT NULL DEFAULT false;
