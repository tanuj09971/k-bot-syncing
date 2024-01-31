import { TxnStatus } from "@prisma/client";

export const TIMEOUT_DURATION = 210000; //Time out duration for txn stuck in mempool
export const GAS_PRICE_MULTIPLIER = BigInt(3); //Gas multiplier for retrying the txn
export const MAX_RANGE_SIZE = 1000; //Max block range size for fetching ping events
export interface PingDTO {
  transactionHash;
  blockHash;
  blockNumber: number;
}

export enum Timeout {
  Timeout = "Timeout",
}

export interface PongRecordDto {
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

export interface UpdatePongStatusDto {
  pingId: string;
  txnStatus: TxnStatus;
}
