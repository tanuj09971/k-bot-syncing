export interface PingEvent {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  address: string;
  topics: string[];
  index: number;
  transactionIndex: number;
}
export const THREE_MINUTES_IN_MILLISECONDS = 3 * 60 * 1000;