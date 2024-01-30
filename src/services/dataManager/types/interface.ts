export interface CreatePingDTO {
  txnHash?: string;
  blockNumber?: number;
}
export interface PongTransactionCreateDTO {
  nonce: number;
  txnHash: string;
  pingId: string;
  message?: string;
}

export interface PongTransactionUpdateDTO {
  txnHash: string;
  message: string;
}
