import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PongRecordDto, UpdatePongStatusDto } from "../events/types/interfaces";
import { Ping, Pong, TxnStatus } from "@prisma/client";
import { PongTransactionCreateDTO } from "./types/interface";
import { PingEvent } from "../temporal/types/interface";

@Injectable()
export class PingPongService {
  constructor(private prisma: PrismaService) {}

  // CREATE operations

  /**
   * Creates multiple Ping records in the database.
   * @param pings - Array of PingEvent objects.
   * @returns Promise<void>
   */
  async createPingRecords(pings: PingEvent[]): Promise<void> {
    const pingRecords = pings.map(ping => ({
      txnHash: ping.transactionHash,
      blockNumber: ping.blockNumber,
    }));

    await this.prisma.ping.createMany({
      data: pingRecords,
    });
  }

  /**
   * Creates a Pong record in the database.
   * @param dto - Data for creating a Pong record.
   * @returns Promise<void>
   */
  async createPongRecord(dto: PongRecordDto): Promise<void> {
    const { nonce, txnHash, pingId } = dto;
    await this.prisma.pong.create({
      data: {
        nonce: nonce,
        txnHash: txnHash,
        pingId: pingId,
        txnStatus: TxnStatus.InProgress,
      },
    });
  }

  /**
   * Creates a PongTransaction record in the database.
   * @param param0 - Data for creating a PongTransaction record.
   * @returns Promise<void>
   */
  async createPongTransactionRecord({ nonce, txnHash, pingId, message }: PongTransactionCreateDTO): Promise<void> {
    await this.prisma.pongTransaction.create({
      data: {
        nonce: nonce,
        txnHash: txnHash,
        pingId: pingId,
        message: message,
      },
    });
  }

  // READ operations

  /**
   * Retrieves the latest Ping record from the database.
   * @returns Promise<Ping | null>
   */
  async getLatestPing(): Promise<Ping | null> {
    const latestPing = await this.prisma.ping.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    return latestPing;
  }

  /**
   * Retrieves a list of unprocessed Ping records from the database.
   * @returns Promise<Ping[]>
   */
  async getUnprocessedPings(): Promise<Ping[]> {
    const receivedPings = await this.prisma.ping.findMany({
      where: {
        isPongProcessed: false,
      },
    });
    return receivedPings;
  }

  /**
   * Retrieves the last processed PongTransaction record from the database.
   * @returns Promise<Pong | null>
   */
  async getLastPongTransaction(): Promise<Pong | null> {
    const lastPongEvent = await this.prisma.pong.findFirst({
      orderBy: {
        nonce: "desc",
      },
      where: {
        txnStatus: TxnStatus.Failed || TxnStatus.Done,
      },
    });
    return lastPongEvent;
  }

  // UPDATE operations

  /**
   * Updates the transaction status of a Pong record in the database.
   * @param dto - Data for updating the Pong record.
   * @returns Promise<void>
   */
  async updatePongStatus(dto: UpdatePongStatusDto): Promise<void> {
    const { pingId, txnStatus } = dto;
    await this.prisma.pong.update({
      where: {
        pingId: pingId,
      },
      data: {
        txnStatus: txnStatus,
      },
    });
  }

  /**
   * Marks all Ping records with a specific transaction hash as processed.
   * @param txnHash - Transaction hash to identify Ping records.
   * @returns Promise<void>
   */
  async markPingAsProcessed(txnHash: string): Promise<void> {
    await this.prisma.ping.updateMany({
      where: {
        txnHash: txnHash,
      },
      data: {
        isPongProcessed: true,
      },
    });
  }
}
