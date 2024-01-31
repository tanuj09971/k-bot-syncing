import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Activities, Activity } from 'nestjs-temporal';
import { EventsService } from 'src/services/events/events.service';
import { PingPongService } from 'src/services/pingPong/pingPong.service';

@Injectable()
@Activities()
export class ContractWatchers {
  private contractAddress: string;

  constructor(
    private configService: ConfigService,
    private eventService: EventsService,
    private pingPongService: PingPongService,
  ) {
    this.initialize();
  }

  private async initialize() {
    this.contractAddress = this.configService.get('contractAddress');
  }

  @Activity()
  async watchBlockForPingTransactions(): Promise<void> {
    const { fromBlock, toBlock } = await this.eventService.calculateBlockRange();
    const pingEventsData = await this.eventService.getPingDetails({
      fromBlock: fromBlock,
      toBlock: toBlock,
    });
    await this.pingPongService.createPingRecords(pingEventsData);
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
  watchBlockForPingTransactions(): Promise<void>;
}

export interface PongActivity {
  executeUnprocessedPongTransactions(): Promise<void>;
}
