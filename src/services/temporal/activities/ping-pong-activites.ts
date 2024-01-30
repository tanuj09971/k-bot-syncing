import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Activities, Activity } from "nestjs-temporal";
import { EventsService } from "src/services/events/events.service";
import { Web3Service } from "src/web3/web3.service";
import { PingEvent } from "../types/interface";
import { PingPongService } from "src/services/pingPong/pingPong.service";

@Injectable()
@Activities()
export class ContractWatchers {
  private contractAddress: string;

  constructor(
    private configService: ConfigService,
    private web3Service: Web3Service,
    private eventService: EventsService,
    private pingPongService: PingPongService
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
    const lastPingEvent = await this.pingPongService.getLatestPing();
    const latestFetchedBlock: number = lastPingEvent?.blockNumber ?? startBlock;
    const fromBlock = latestFetchedBlock + 1;
    const toBlock = latestBlockNumber;

    const pingEventsData = await this.eventService.getPingDetails({
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    const createPingPromises = pingEventsData.map(async (event: PingEvent) => {
      return this.pingPongService.createPingRecord({
        txnHash: event?.transactionHash,
        blockNumber: event?.blockNumber,
      });
    });

    await Promise.all(createPingPromises);
  }

  @Activity()
  async executeUnprocessedPongTransactions(): Promise<void> {
    const pingResults = await this.pingPongService.getUnprocessedPings();
    for (const result of pingResults) {
      await this.eventService.executePongTransaction(result?.txnHash);
    }
  }
}

export interface PingActivity {
  watchBlockForPingEvents(): Promise<void>;
}

export interface PongActivity {
  executeUnprocessedPongTransactions(): Promise<void>;
}
