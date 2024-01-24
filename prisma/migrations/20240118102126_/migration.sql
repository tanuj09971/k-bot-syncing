-- CreateTable
CREATE TABLE "Pong" (
    "txnHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "pingId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Pong_txnHash_key" ON "Pong"("txnHash");

-- CreateIndex
CREATE UNIQUE INDEX "Pong_pingId_key" ON "Pong"("pingId");
