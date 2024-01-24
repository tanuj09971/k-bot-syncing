-- CreateEnum
CREATE TYPE "TxnStatus" AS ENUM ('Pending', 'InProgress', 'Done');

-- AlterTable
ALTER TABLE "Pong" ADD COLUMN     "txnStatus" "TxnStatus" NOT NULL DEFAULT 'Pending',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
