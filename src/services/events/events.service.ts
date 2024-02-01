import { Injectable, Logger } from "@nestjs/common";
import { Web3Service } from "../../web3/web3.service";
import { TxnStatus } from "@prisma/client";
import { PingPongService } from "../pingPong/pingPong.service";
import { DELAY, delay } from "./utils/utils";
import { BlockRange, EthereumTransactionEvent, MAX_RANGE_SIZE, TIMEOUT_DURATION, Timeout } from "./types/interfaces";
import { ConfigService } from "@nestjs/config";
import { EthersError, TransactionReceipt, TransactionResponse } from "ethers";
@Injectable()
export class EventsService {
  private contractAddress: string;

  constructor(
    private web3Service: Web3Service,
    private configService: ConfigService,
    private logger: Logger,
    private pingPongService: PingPongService,
  ) {
    this.initialize();
  }

  private async initialize() {
    this.contractAddress = this.configService.get("contractAddress");
  }

  /**
   * Calculates the transaction nonce for the Pong transaction, considering the last recorded nonce.
   * @returns Promise<number>
   */
  async calculateTransactionNonce(): Promise<number> {
    const lastPongEvent = await this.pingPongService.getLastPongTransaction();

    if (lastPongEvent) {
      return lastPongEvent.nonce;
    } else {
      const nonce = await this.web3Service.getNonce();
      return nonce;
    }
  }

  /**
   * Executes the Pong transaction, handling retries and updating records accordingly.
   * @param txnHash - The hash of the transaction.
   * @returns Promise<void>
   */
  async executePongTransaction(txnHash: string): Promise<void> {
    let txnSuccessfull = false;
    let retries = 0;
    let tx;
    let receipt;
    let prevHash;
    while (!txnSuccessfull) {
      const gasPriceMultiplier = BigInt(retries + 1);
      const nonce = await this.calculateTransactionNonce();
      if (prevHash) {
        const prevReceipt = await this.web3Service.getReceipt(prevHash);
        if (prevReceipt?.status) break;
      }
      try {
        tx = await this.createPongContractCall(txnHash, nonce, gasPriceMultiplier);
        if (!retries && tx) {
          await this.createInitialPongRecord(txnHash, tx);
        }

        const result = await this.waitForTransactionResult(tx);
        receipt = result !== Timeout.Timeout ? result : null;

        if (result !== Timeout.Timeout && receipt?.status === 1) {
          this.handleDataForSuccessfulPongExecution(txnHash, tx);
          txnSuccessfull = true;
        }
      } catch (error) {
        await this.handleDataForFailedPongExecution(txnHash, tx, error, receipt);
      }
      prevHash = tx?.hash;
      await delay(DELAY);
      retries++;
    }
  }

  //build transaction for gas fee estimation
  buildTransaction(txnHash: string): { to: string; data: string } {
    return {
      to: this.contractAddress,
      data: this.web3Service.encodePongFunctionData(txnHash),
    };
  }

  /**
   * Creates a Pong contract call transaction and returns the transaction response.
   * @param txnHash - The hash of the transaction.
   * @param nonce - The transaction nonce.
   * @param gasPriceMultiplier - The gas price multiplier.
   * @returns Promise<TransactionResponse>
   */
  async createPongContractCall(txnHash: string, nonce: number, gasPriceMultiplier: bigint): Promise<TransactionResponse> {
    const transaction = this.buildTransaction(txnHash);
    const gasPrice = await this.web3Service.estimateGasPrice(transaction);
    const newGasPrice = gasPrice * gasPriceMultiplier;
    const tx = await this.web3Service.makePongContractCall(txnHash, nonce, newGasPrice);
    this.logger.log("tx created", tx);

    return tx;
  }

  /**
   * Creates an initial Pong record based on the transaction details.
   * @param txnHash - The hash of the transaction.
   * @param tx - The transaction response object.
   * @returns Promise<void>
   */
  async createInitialPongRecord(txnHash: string, tx: TransactionResponse): Promise<void> {
    if (tx.nonce !== undefined && tx.hash !== undefined) {
      await this.pingPongService.createPongRecord({
        nonce: tx?.nonce,
        txnHash: tx?.hash,
        pingId: txnHash,
        txnStatus: TxnStatus.InProgress,
      });

      await this.pingPongService.markPingAsProcessed(txnHash);
    }
  }

  /**
   * Waits for the transaction result or times out after a specified duration.
   * @param tx - The transaction response object.
   * @returns Promise<TransactionReceipt | string>
   */
  async waitForTransactionResult(tx: TransactionResponse): Promise<TransactionReceipt | string> {
    const timeoutPromise = new Promise<string | Timeout>((_, resolve) => setTimeout(() => resolve(Timeout.Timeout), TIMEOUT_DURATION));
    const txnPromise = tx.wait();
    return Promise.race([txnPromise, timeoutPromise]);
  }

  /**
   * Handles data in db for successful execution of the Pong function.
   * @param txnHash - The hash of the transaction.
   * @param tx - The transaction response object.
   * @returns void
   */

  handleDataForSuccessfulPongExecution(txnHash: string, tx: TransactionResponse): void {
    this.pingPongService.createPongTransactionRecord({
      nonce: tx.nonce,
      txnHash: tx.hash,
      pingId: txnHash,
    });

    this.pingPongService.updatePongStatus({
      pingId: txnHash,
      txnStatus: TxnStatus.Done,
    });
    this.logger.log("Pong function executed successfully!");
  }

  /**
   * Handles data in db for failed execution of the Pong function.
   * @param txnHash - The hash of the transaction.
   * @param tx - The transaction response object.
   * @param error - The error object.
   * @param receipt - The transaction receipt.
   * @returns Promise<void>
   */
  async handleDataForFailedPongExecution(txnHash: string, tx: TransactionResponse, error: EthersError, receipt: TransactionReceipt): Promise<void> {
    if (txnHash && receipt?.status === 0) {
      await this.pingPongService.updatePongStatus({
        pingId: txnHash,
        txnStatus: TxnStatus.Failed,
      });
    }
    if (tx) {
      await this.pingPongService.createPongTransactionRecord({
        nonce: tx?.nonce,
        txnHash: tx?.hash,
        pingId: txnHash,
        message: error?.message,
      });
    }
    this.logger.error("Error calling Pong function:", error);
  }

  /**
   * Retrieves details of Ping transactions within a specified block range.
   * @param blockRange - Object specifying the block range.
   * @returns Promise<EthereumTransactionEvent[]>
   */
  async getPingDetails({ fromBlock, toBlock }: BlockRange): Promise<EthereumTransactionEvent[]> {
    const blockRange = toBlock - fromBlock;
    const numRequests = Math.ceil(blockRange / MAX_RANGE_SIZE);
    const allEventLogs = [];
    for (let i = 0; i < numRequests; i++) {
      const startBlock = fromBlock + i * MAX_RANGE_SIZE;
      const endBlock = Math.min(toBlock, startBlock + MAX_RANGE_SIZE - 1);
      const eventLogs = await this.web3Service.getEventLogs(startBlock, endBlock);
      allEventLogs.push(...eventLogs);
    }
    this.logger.log("EventLogs", allEventLogs);
    return allEventLogs;
  }

  /**
   * Retrieves the block number of the last processed Ping event.
   * @returns Promise<number>
   */
  async getLastProcessedBlock(): Promise<number> {
    const lastPingEvent = await this.pingPongService.getLatestPing();
    return lastPingEvent?.blockNumber;
  }

  /**
   * Determines the start block for fetching Ping details based on the latest block number.
   * If a custom start block is configured in the application settings, it is used;
   * otherwise, it defaults to the latest 15 block .
   * @param latestBlockNumber - The latest block number from the Ethereum network.
   * @returns Promise<number>
   */
  async getStartBlock(latestBlockNumber: number): Promise<number> {
    const startBlock = this.configService.get("fromBlock") ?? latestBlockNumber - 15;
    return startBlock;
  }

  /**
   * Calculates the block range for fetching Ping details based on the latest block number.
   * It determines the 'fromBlock' as the block number succeeding the last processed Ping event
   * or a custom start block if no Ping events have been processed yet.
   * The 'toBlock' is set to the current latest block number.
   * @returns Promise<{ fromBlock: number; toBlock: number }>
   */
  async calculateBlockRange(): Promise<{ fromBlock: number; toBlock: number }> {
    const latestBlockNumber: number = await this.web3Service.getBlockNumber();
    const lastPingEvent = await this.pingPongService.getLatestPing();
    const latestFetchedBlock: number = lastPingEvent?.blockNumber ?? (await this.getStartBlock(latestBlockNumber));
    const fromBlock = latestFetchedBlock + 1;
    const toBlock = latestBlockNumber;
    return { fromBlock, toBlock };
  }
}
