import { Logger, Module } from "@nestjs/common";
import { Web3Module } from "src/web3/web3.module";
import { PrismaService } from "src/prisma/prisma.service";
import { TemporalController } from "./temporal.controller";
import { ContractWatchers } from "./activities/ping-pong-activites";
import { EventsService } from "../events/events.service";
import { DataManagerService } from "../dataManager/dataManager.service";

@Module({
  providers: [
    PrismaService,
    Web3Module,
    ContractWatchers,
    EventsService,
    Logger,
    DataManagerService,
  ],
  controllers: [TemporalController],
  imports: [Web3Module],
})
export class TemporalJobModule {}
