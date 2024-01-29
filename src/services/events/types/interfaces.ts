import { TxnStatus } from "@prisma/client";

export interface PingDTO {
  transactionHash;
  blockHash;
  blockNumber: number;
}

export enum Timeout {
  Timeout = "Timeout",
}
export const TIMEOUT_DURATION = 240000;
export const GAS_PRICE_MULTIPLIER = BigInt(3);
export const MAX_RANGE_SIZE = 1000;
export interface PongEntryDTO {
  nonce: number;
  txnHash: string;
  pingId: string;
  txnStatus: TxnStatus;
}
export interface EthereumTransactionEvent {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  index: number;
  transactionIndex: number;
}
export interface BlockRange {
  fromBlock: number;
  toBlock: number;
}

export interface updatePongStatusDto {
  pingId: string;
  txnStatus: TxnStatus;
}
