-- CreateTable
CREATE TABLE "Ping" (
    "txnHash" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Ping_txnHash_key" ON "Ping"("txnHash");
