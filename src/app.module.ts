import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/config.module";
import { Web3Module } from "./web3/web3.module";

@Module({
  imports: [AppConfigModule, Web3Module],
  controllers: [],
  providers: [],
})
export class AppModule {}
