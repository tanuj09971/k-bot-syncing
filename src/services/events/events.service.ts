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
import { ConfigService } from "@nestjs/config";
import { TransactionReceipt, TransactionResponse } from "ethers";
@Injectable()
export class EventsService {
  private contractAddress: string;

  constructor(
    private web3Service: Web3Service,
    private configService: ConfigService,
    private logger: Logger,
    private dataManagerService: DataManagerService
  ) {
    this.initialize();
  }
  private async initialize() {
    this.contractAddress = this.configService.get("contractAddress");
  }
  async calculateTransactionNonce(): Promise<number> {
    const nonce = await this.web3Service.getNonce();
    const lastPongEvent = await this.dataManagerService.getLastPongEvent();
    return lastPongEvent?.nonce ? lastPongEvent?.nonce : nonce;
  }

  async executePongTransaction(txnHash: string): Promise<void> {
    let txnSuccessfull = false;
    let loopCount = 0;
    let tx;
    let receipt;
    while (!txnSuccessfull) {
      const gasPriceMultiplier = BigInt(loopCount + 1);
      const nonce = await this.calculateTransactionNonce();

      try {
        tx = await this.createPongContractCall(
          txnHash,
          nonce,
          gasPriceMultiplier
        );
        if (!loopCount) {
          await this.createInitialPongRecord(txnHash, tx);
        }

        const result = await this.waitForTransactionResult(tx);
        receipt = await tx.wait();

        if (result !== Timeout.Timeout && receipt.status === 1) {
          await this.handleSuccessfulPongExecution(txnHash);
          txnSuccessfull = true;
        }
      } catch (error) {
        await this.handleFailedPongExecution(txnHash, tx, error, receipt);
      }

      await delay(DELAY);
      loopCount++;
    }
  }

  buildTransaction(txnHash: string): { to: string; data: string } {
    return {
      to: this.contractAddress,
      data: this.web3Service.encodePongFunctionData(txnHash),
    };
  }

  async createPongContractCall(
    txnHash: string,
    nonce: number,
    gasPriceMultiplier: bigint
  ): Promise<TransactionResponse> {
    const transaction = this.buildTransaction(txnHash);
    const gasPrice = await this.web3Service.estimateGasPrice(transaction);
    const newGasPrice = gasPrice * gasPriceMultiplier;
    const tx = await this.web3Service.makePongContractCall(
      txnHash,
      nonce,
      newGasPrice
    );
    this.logger.log("tx created", tx);
    await this.dataManagerService.createPongTransactionRecord({
      nonce: tx.nonce,
      txnHash: tx.hash,
      pingId: txnHash,
    });
    return tx;
  }

  async createInitialPongRecord(
    txnHash: string,
    tx: TransactionResponse
  ): Promise<void> {
    if (tx.nonce !== undefined && tx.hash !== undefined) {
      await this.dataManagerService.createPongRecord({
        nonce: tx.nonce,
        txnHash: tx.hash,
        pingId: txnHash,
        txnStatus: TxnStatus.InProgress,
      });

      await this.dataManagerService.markPingAsProcessed(txnHash);
    }
  }

  async waitForTransactionResult(
    tx: TransactionResponse
  ): Promise<TransactionReceipt | string> {
    const timeoutPromise = new Promise<string | Timeout>((_, reject) =>
      setTimeout(() => reject(new Error(Timeout.Timeout)), TIMEOUT_DURATION)
    );
    const txnPromise = tx.wait();
    return Promise.race([txnPromise, timeoutPromise]);
  }

  async handleSuccessfulPongExecution(txnHash: string): Promise<void> {
    await this.dataManagerService.updatePongStatus({
      pingId: txnHash,
      txnStatus: TxnStatus.Done,
    });

    this.logger.log("Pong function executed successfully!");
  }

  async handleFailedPongExecution(
    txnHash: string,
    tx: TransactionResponse,
    error: any,
    receipt: TransactionReceipt
  ): Promise<void> {
    if (receipt?.status === 0) {
      await this.dataManagerService.updatePongStatus({
        pingId: txnHash,
        txnStatus: TxnStatus.Failed,
      });
    }
    await this.dataManagerService.updatePongTransactionRecord({
      txnHash: tx?.hash,
      message: error?.message,
    });

    this.logger.error("Error calling Pong function:", error);
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
