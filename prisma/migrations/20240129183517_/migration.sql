-- CreateTable
CREATE TABLE "PongTransaction" (
    "nonce" INTEGER NOT NULL,
    "txnHash" TEXT NOT NULL,
    "message" TEXT,
    "pingId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "PongTransaction_txnHash_key" ON "PongTransaction"("txnHash");

-- AddForeignKey
ALTER TABLE "PongTransaction" ADD CONSTRAINT "PongTransaction_pingId_fkey" FOREIGN KEY ("pingId") REFERENCES "Pong"("pingId") ON DELETE RESTRICT ON UPDATE CASCADE;
