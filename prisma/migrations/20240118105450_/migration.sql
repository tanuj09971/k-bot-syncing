/*
  Warnings:

  - You are about to drop the column `blockNumber` on the `Pong` table. All the data in the column will be lost.
  - Added the required column `nonce` to the `Pong` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pong" DROP COLUMN "blockNumber",
ADD COLUMN     "nonce" INTEGER NOT NULL;
