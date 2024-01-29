import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { PongRecordDto, updatePongStatusDto } from "../events/types/interfaces";
import { Ping, Pong, TxnStatus } from "@prisma/client";
import {
  CreatePingDTO,
  PongTransactionCreateDTO,
  PongTransactionUpdateDTO,
} from "./types/interface";

@Injectable()
export class DataManagerService {
  constructor(private prisma: PrismaService) {}

  // CREATE operations
  async createPingRecord(data: CreatePingDTO): Promise<void> {
    await this.prisma.ping.create({
      data: {
        txnHash: data.txnHash,
        blockNumber: data.blockNumber,
      },
    });
  }

  async createPongRecord(dto: PongRecordDto) {
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

  async createPongTransactionRecord({
    nonce,
    txnHash,
    pingId,
  }: PongTransactionCreateDTO) {
    await this.prisma.pongTransaction.create({
      data: {
        nonce: nonce,
        txnHash: txnHash,
        pingId: pingId,
      },
    });
  }

  // READ operations
  async getLatestPing() {
    const latestPing = await this.prisma.ping.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    return latestPing;
  }

  async getUnprocessedPings(): Promise<Ping[]> {
    const receivedPings = await this.prisma.ping.findMany({
      where: {
        isPongProcessed: false,
      },
    });
    return receivedPings;
  }

  async getFailedPongEvents(): Promise<Pong[]> {
    const failedPongEvents = await this.prisma.pong.findMany({
      where: {
        txnStatus: TxnStatus.Failed,
      },
    });
    return failedPongEvents;
  }

  async getLastPongEvent(): Promise<Pong> {
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

  async getInProgressPongEvent() {
    const pongEvent = await this.prisma.pong.findFirst({
      where: {
        txnStatus: TxnStatus.InProgress,
      },
      orderBy: {
        nonce: "desc",
      },
    });
    return pongEvent;
  }

  // UPDATE operations
  async updatePingStatus(
    txnHash: string,
    isPongProcessed: boolean
  ): Promise<void> {
    await this.prisma.ping.update({
      where: { txnHash: txnHash },
      data: { isPongProcessed: isPongProcessed },
    });
  }

  async updatePongStatus(dto: updatePongStatusDto) {
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

  async updatePongRecord(
    txnHash: string,
    txnStatus: TxnStatus,
    pingId: string,
    nonce: number
  ) {
    await this.prisma.pong.update({
      where: {
        pingId: pingId,
      },
      data: {
        txnHash: txnHash,
        txnStatus: txnStatus,
        nonce: nonce,
      },
    });
  }

  async updatePongTransactionRecord({
    txnHash,
    message,
  }: PongTransactionUpdateDTO) {
    await this.prisma.pongTransaction.update({
      where: {
        txnHash: txnHash,
      },
      data: {
        message: message,
      },
    });
  }
  async markPingAsProcessed(txnHash: string) {
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
