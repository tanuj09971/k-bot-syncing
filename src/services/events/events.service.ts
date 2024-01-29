import { Injectable, Logger } from "@nestjs/common";
import { Web3Service } from "../../web3/web3.service";
import { TxnStatus } from "@prisma/client";
import { DataManagerService } from "../dataManager/dataManager.service";
import { DELAY, delay } from "./utils/utils";
import {
  BlockRange,
  EthereumTransactionEvent,
  MAX_RANGE_SIZE,
  TIMEOUT_DURATION,
  Timeout,
} from "./types/interfaces";
@Injectable()
export class EventsService {
  constructor(
    private web3Service: Web3Service,
    private logger: Logger,
    private dataManagerService: DataManagerService
  ) {}

  async calculateTransactionNonce(isFailedTxn: boolean): Promise<number> {
    const nonce = await this.web3Service.getNonce();
    const lastPongEvent = await this.dataManagerService.getLastPongEvent();
    const lastProcessedNonce = isFailedTxn ? nonce : lastPongEvent?.nonce + 1;
    return lastProcessedNonce ? lastProcessedNonce : nonce;
  }

  async sendPongTransaction(
    txnHash: string,
    isFailedTxn?: boolean
  ): Promise<void> {
    let txnSuccessfull = false;
    let timeout = false;

    while (!txnSuccessfull && !timeout) {
      const nonce = await this.calculateTransactionNonce(isFailedTxn);
      const tx = await this.web3Service.makePongContractCall(txnHash, nonce);
      await this.dataManagerService.markPingAsProcessed(txnHash);
      try {
        this.logger.log("tx created", tx);
        if (isFailedTxn) {
          await this.dataManagerService.updatePongEntry({
            nonce: tx?.nonce,
            txnHash: tx?.hash,
            pingId: txnHash,
            txnStatus: TxnStatus.InProgress,
          });
        } else {
          await this.dataManagerService.createPongRecord({
            nonce: tx?.nonce,
            txnHash: tx?.hash,
            pingId: txnHash,
            txnStatus: TxnStatus.InProgress,
          });
        }
        const txnPromise = tx.wait();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error(Timeout.Timeout)), TIMEOUT_DURATION)
        );
        const result = await Promise.race([txnPromise, timeoutPromise]);
        const receipt = await txnPromise;
        if (result === Timeout.Timeout && receipt.status !== 1) {
          timeout = true;
        } else {
          await this.dataManagerService.updatePongStatus({
            pingId: txnHash,
            txnStatus: TxnStatus.Done,
          });
          txnSuccessfull = true;
          this.logger.log("Pong function executed successfully!");
        }
      } catch (error) {
        await this.dataManagerService.updatePongStatus({
          pingId: txnHash,
          txnStatus: TxnStatus.Done,
        });
        await delay(DELAY);
        this.logger.error("Error calling Pong function:", error);
      }
    }
  }

  async getPingDetails({
    fromBlock,
    toBlock,
  }: BlockRange): Promise<EthereumTransactionEvent[]> {
    const blockRange = toBlock - fromBlock;
    const numRequests = Math.ceil(blockRange / MAX_RANGE_SIZE);
    const allEventLogs = [];
    for (let i = 0; i < numRequests; i++) {
      const startBlock = fromBlock + i * MAX_RANGE_SIZE;
      const endBlock = Math.min(toBlock, startBlock + MAX_RANGE_SIZE - 1);
      const eventLogs = await this.web3Service.getEventLogs(
        startBlock,
        endBlock
      );
      allEventLogs.push(...eventLogs);
    }
    this.logger.log("EventLogs", allEventLogs);
    return allEventLogs;
  }

  async getLastProcessedBlock(): Promise<number> {
    const lastPingEvent = await this.dataManagerService.getLatestPing();
    return lastPingEvent?.blockNumber;
  }
}
