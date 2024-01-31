import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ethers } from "ethers";

@Injectable()
export class Web3Service {
  private ethersInstance: ethers.JsonRpcProvider;
  private contractAddress: string;
  private contractAbi: string;
  private signer: ethers.Signer;
  private contract: ethers.Contract;
  private web3RpcUrls: string[];

  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    private logger: Logger,
  ) {
    this.initialize();
  }

  /**
   * Initializes the Web3Service by fetching necessary configurations,
   * initializing Ethereum provider, signer, and contract instances.
   * @returns Promise<void>
   */
  private async initialize(): Promise<void> {
    this.contractAddress = this.configService.get("contractAddress");
    this.contractAbi = this.configService.get("contractAbi");
    this.web3RpcUrls = this.configService.get("web3NodeUrl");
    this.ethersInstance = await this.getEthersInstance();
    this.signer = new ethers.Wallet(this.configService.get("privateKey"), this.ethersInstance);
    this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.signer);
  }

  /**
   * Retrieves an Ethereum provider instance from available RPC URLs.
   * @returns Promise<ethers.JsonRpcProvider>
   */
  async getEthersInstance(): Promise<ethers.JsonRpcProvider> {
    const blockNumberPromises = this.web3RpcUrls.map(async (url: string) => {
      return new Promise<string>(async (resolve,reject) => {
        const blockNumber = await this.getBlock(url);
        if (blockNumber) {
          resolve(url);
        }else{
          reject(new Error('Error'))
        }
      });
    });
    const url = await Promise.any(blockNumberPromises);
    return new ethers.JsonRpcProvider(url);
  }

  /**
   * Retrieves event logs for the specified block range from available RPC URLs.
   * @param startBlock - The starting block number.
   * @param endBlock - The ending block number.
   * @returns Promise<ethers.Log[]>
   */
  async getEventLogs(startBlock: number, endBlock: number): Promise<ethers.Log[]> {
    const eventLogsPromises = this.web3RpcUrls.map(async url => {
      return this.getPingLogs(url, startBlock, endBlock);
    });
    const eventLogs = await Promise.any(eventLogsPromises);
    return eventLogs;
  }

  /**
   * Retrieves the current block number from available RPC URLs.
   * @returns Promise<number>
   */
  async getBlockNumber(): Promise<number> {
    const blockNumberPromises = this.web3RpcUrls.map(async url => {
      return this.getBlock(url);
    });
    const blockNumber = await Promise.any(blockNumberPromises);
    return blockNumber;
  }

  /**
   * Retrieves the current nonce of the signer wallet from available RPC URLs.
   * @returns Promise<number>
   */
  async getNonce(): Promise<number> {
    const noncePromises = this.web3RpcUrls.map(async url => {
      return this.getTransactionCount(url);
    });
    const nonce = await Promise.any(noncePromises);
    return nonce;
  }

  /**
   * Estimates the gas price for a given transaction from available RPC URLs.
   * @param transaction - The transaction for which gas price is estimated.
   * @returns Promise<bigint>
   */
  async estimateGasPrice(transaction: ethers.TransactionRequest): Promise<bigint> {
    const gasPricePromises = this.web3RpcUrls.map(async url => {
      return this.getEstimatedGasPrice(url, transaction);
    });
    const gasPrice = await Promise.any(gasPricePromises);
    return gasPrice;
  }

  /**
   * Executes the 'pong' contract call for a given transaction hash and nonce.
   * @param txnHash - The transaction hash.
   * @param nonce - The nonce for the contract call.
   * @param gasPrice - Optional gas price for the contract call.
   * @returns Promise<any>
   */
  async makePongContractCall(txnHash: string, nonce: number, gasPrice?: bigint): Promise<any> {
    const options: { nonce: number; gasPrice?: bigint } = { nonce };

    if (gasPrice !== undefined) {
      options.gasPrice = gasPrice;
    }
    return this.contract.pong(txnHash, options);
  }

  /**
   * Encodes the 'pong' function data for a given ping ID.
   * @param pingId - The ping ID.
   * @returns string
   */
  encodePongFunctionData(pingId: string): string {
    return this.contract.interface.encodeFunctionData("pong", [pingId]);
  }

  /**
   * Retrieves the transaction receipt for a given transaction hash.
   * @param txHash - The transaction hash.
   * @returns Promise<ethers.TransactionReceipt>
   */
  async getReceipt(txHash: string): Promise<ethers.TransactionReceipt> {
    const receipt = await this.ethersInstance.getTransactionReceipt(txHash);
    return receipt;
  }

  /**
   * Retrieves Ping logs for the specified block range from a specific RPC URL.
   * @param url - The RPC URL.
   * @param startBlock - The starting block number.
   * @param endBlock - The ending block number.
   * @returns Promise<ethers.Log[]>
   */
  private async getPingLogs(url: string, startBlock: number, endBlock: number): Promise<ethers.Log[]> {
    const ethersInstance = new ethers.JsonRpcProvider(url);

    return ethersInstance.getLogs({
      fromBlock: startBlock,
      toBlock: endBlock,
      address: this.contractAddress,
      topics: [this.configService.get("pingTopic")],
    });
  }

  /**
   * Retrieves the current block number from a specific RPC URL.
   * @param url - The RPC URL.
   * @returns Promise<number>
   */
  private async getBlock(url: string): Promise<number> {
    const ethersInstance = new ethers.JsonRpcProvider(url);
    return ethersInstance.getBlockNumber();
  }

  /**
   * Retrieves the transaction count (nonce) for the signer wallet from a specific RPC URL.
   * @param url - The RPC URL.
   * @returns Promise<number>
   */
  private async getTransactionCount(url: string): Promise<number> {
    const ethersInstance = new ethers.JsonRpcProvider(url);
    return ethersInstance.getTransactionCount(this.signer);
  }

  /**
   * Estimates the gas price for a given transaction from a specific RPC URL.
   * @param url - The RPC URL.
   * @param transaction - The transaction for which gas price is estimated.
   * @returns Promise<bigint>
   */
  private async getEstimatedGasPrice(url: string, transaction: ethers.TransactionRequest): Promise<bigint> {
    const ethersInstance = new ethers.JsonRpcProvider(url);
    return ethersInstance.estimateGas(transaction);
  }
}
