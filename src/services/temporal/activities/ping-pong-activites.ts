import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Activities, Activity } from "nestjs-temporal";
import { EventsService } from "src/services/events/events.service";
import { Web3Service } from "src/web3/web3.service";
import { PingEvent } from "../types/interface";
import { DataManagerService } from "src/services/dataManager/dataManager.service";
import { GAS_PRICE_MULTIPLIER } from "src/services/events/types/interfaces";
import { TxnStatus } from "@prisma/client";
import {
  DELAY,
  delay,
  isOlderThan3Minutes,
} from "src/services/events/utils/utils";

@Injectable()
@Activities()
export class ContractWatchers {
  private contractAddress: string;

  constructor(
    private configService: ConfigService,
    private web3Service: Web3Service,
    private eventService: EventsService,
    private logger: Logger,
    private dataManagerService: DataManagerService
  ) {
    this.initialize();
  }
  private async initialize() {
    this.contractAddress = this.configService.get("contractAddress");
  }
  @Activity()
  async watchBlockForPingEvents(): Promise<void> {
    const latestBlockNumber: number = await this.web3Service.getBlockNumber();
    const startBlock =
      this.configService.get("fromBlock") ?? latestBlockNumber - 15;
    const lastPingEvent = await this.dataManagerService.getLatestPing();
    const latestFetchedBlock: number = lastPingEvent?.blockNumber ?? startBlock;
    const fromBlock = latestFetchedBlock + 1;
    const toBlock = latestBlockNumber;

    const pingEventsData = await this.eventService.getPingDetails({
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    const createPingPromises = pingEventsData.map(async (event: PingEvent) => {
      return this.dataManagerService.createPingRecord({
        txnHash: event?.transactionHash,
        blockNumber: event?.blockNumber,
      });
    });

    await Promise.all(createPingPromises);
  }

  @Activity()
  async watchProcessedPongEvents(): Promise<void> {
    const pingResults = await this.dataManagerService.getUnprocessedPings();
    for (const result of pingResults) {
      await this.eventService.sendPongTransaction(result?.txnHash);
    }
  }

  @Activity()
  async watchFailedEmitPongEvents(): Promise<void> {
    const failedPongEvents =
      await this.dataManagerService.getFailedPongEvents();
    for (const result of failedPongEvents) {
      await this.eventService.sendPongTransaction(result?.pingId, true);
    }
  }

  @Activity()
  async watchInProgressPong(): Promise<void> {
    const inProgressPongEvent =
      await this.dataManagerService.getInProgressPongEvent();
    if (inProgressPongEvent) {
      const { pingId, nonce, updatedAt } = inProgressPongEvent;
      const transaction = {
        to: this.contractAddress,
        data: this.web3Service.encodePongFunctionData(pingId),
      };
      const isTxnOlderThan3Minutes = isOlderThan3Minutes(updatedAt);
      if (isTxnOlderThan3Minutes) {
        const gasPrice = await this.web3Service.estimateGasPrice(transaction);
        const newTx = await this.web3Service.makePongContractCall(
          pingId,
          nonce,
          gasPrice * GAS_PRICE_MULTIPLIER
        );
        try {
          await newTx.wait();
          await this.dataManagerService.updatePingStatus(pingId, true);
          await this.dataManagerService.updatePongRecord(
            newTx.txnHash,
            TxnStatus.Done,
            pingId,
            newTx?.nonce
          );
        } catch (error) {
          await this.dataManagerService.updatePongRecord(
            newTx.txnHash,
            TxnStatus.Failed,
            pingId,
            newTx?.nonce
          );
          await delay(DELAY);
          this.logger.error("Error calling Pong function:", error);
        }
      }
    }
  }
}

export interface PingActivity {
  watchBlockForPingEvents(): Promise<void>;
}

export interface PongActivity {
  watchProcessedPongEvents(): Promise<void>;
}

export interface FailedPongActivity {
  watchFailedEmitPongEvents(): Promise<void>;
}

export interface InProgressPongActivity {
  watchInProgressPong(): Promise<void>;
}
