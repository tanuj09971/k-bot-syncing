/*
  Warnings:

  - You are about to drop the column `event` on the `Ping` table. All the data in the column will be lost.
  - Changed the type of `pongEmitted` on the `Ping` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PongStatus" AS ENUM ('Received', 'InProgress', 'Done', 'Failed');

-- AlterTable
ALTER TABLE "Ping" DROP COLUMN "event",
DROP COLUMN "pongEmitted",
ADD COLUMN     "pongEmitted" "PongStatus" NOT NULL;
