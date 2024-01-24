-- AlterTable
ALTER TABLE "Ping" ADD CONSTRAINT "Ping_pkey" PRIMARY KEY ("txnHash");

-- AlterTable
ALTER TABLE "Pong" ADD CONSTRAINT "Pong_pkey" PRIMARY KEY ("txnHash");

-- AddForeignKey
ALTER TABLE "Pong" ADD CONSTRAINT "Pong_pingId_fkey" FOREIGN KEY ("pingId") REFERENCES "Ping"("txnHash") ON DELETE RESTRICT ON UPDATE CASCADE;
