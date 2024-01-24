// ethereum.service.ts
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
    private logger: Logger
  ) {
    this.initialize();
  }

  private async initialize() {
    this.contractAddress = this.configService.get("contractAddress");
    this.contractAbi = this.configService.get("contractAbi");
    this.web3RpcUrls = this.configService.get("web3NodeUrl");
    this.ethersInstance = await this.getEthersInstance();
    this.signer = new ethers.Wallet(
      this.configService.get("privateKey"),
      this.ethersInstance
    );
    this.contract = new ethers.Contract(
      this.contractAddress,
      this.contractAbi,
      this.signer
    );
  }

  async getEthersInstance(): Promise<ethers.JsonRpcProvider> {
    const DELAY = 2000;
    const MAX_RETRIES = 3;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const randomIndex = Math.floor(Math.random() * this.web3RpcUrls.length);
      const url = this.web3RpcUrls[randomIndex];
      try {
        const provider = new ethers.JsonRpcProvider(url);
        await provider.getBlockNumber();
        this.ethersInstance = provider;
        return this.ethersInstance;
      } catch (error) {
        this.logger.error(`Error connecting to ${url}: ${error.message}`);
      }
    }
    throw new Error("Failed to connect after multiple attempts");
  }

  async getEventLogs(
    startBlock: number,
    endBlock: number
  ): Promise<ethers.Log[]> {
    const eventLogsPromises = this.web3RpcUrls.map(async (url) => {
      return this.getPingLogs(url, startBlock, endBlock);
    });
    const eventLogs = await Promise.any(eventLogsPromises);
    return eventLogs;
  }

  async getBlockNumber() {
    const blockNumberPromises = this.web3RpcUrls.map(async (url) => {
      return this.getBlock(url);
    });
    const blockNumber = await Promise.any(blockNumberPromises);
    return blockNumber;
  }

  async getNonce() {
    const noncePromises = this.web3RpcUrls.map(async (url) => {
      return this.getTransactionCount(url);
    });
    const nonce = await Promise.any(noncePromises);
    return nonce;
  }

  async estimateGasPrice(
    transaction: ethers.TransactionRequest
  ): Promise<bigint> {
    const gasPricePromises = this.web3RpcUrls.map(async (url) => {
      return this.getEstimatedGasPrice(url, transaction);
    });
    const gasPrice = await Promise.any(gasPricePromises);
    return gasPrice;
  }

  async makePongContractCall(
    txnHash: string,
    nonce: number,
    gasPrice?: bigint
  ): Promise<any> {
    const options: { nonce: number; gasPrice?: bigint } = { nonce };

    if (gasPrice !== undefined) {
      options.gasPrice = gasPrice;
    }
    return await this.contract.pong(txnHash, options);
  }

  encodePongFunctionData(pingId: string) {
    return this.contract.interface.encodeFunctionData("pong", [pingId]);
  }

  private async getPingLogs(
    url: string,
    startBlock: number,
    endBlock: number
  ): Promise<ethers.Log[]> {
    const ethersInstance = new ethers.JsonRpcProvider(url);

    return ethersInstance.getLogs({
      fromBlock: startBlock,
      toBlock: endBlock,
      address: this.contractAddress,
      topics: [this.configService.get("pingTopic")],
    });
  }

  private async getBlock(url: string): Promise<number> {
    const ethersInstance = new ethers.JsonRpcProvider(url);
    return ethersInstance.getBlockNumber();
  }

  private async getTransactionCount(url: string): Promise<number> {
    const ethersInstance = new ethers.JsonRpcProvider(url);
    return ethersInstance.getTransactionCount(this.signer);
  }

  private async getEstimatedGasPrice(
    url: string,
    transaction: ethers.TransactionRequest
  ): Promise<bigint> {
    const ethersInstance = new ethers.JsonRpcProvider(url);
    return ethersInstance.estimateGas(transaction);
  }
}
