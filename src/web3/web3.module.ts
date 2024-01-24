import { Logger, Module } from "@nestjs/common";
import { Web3Service } from "./web3.service";

@Module({
  providers: [Web3Service, Logger],
  exports: [Web3Service],
})
export class Web3Module {}
