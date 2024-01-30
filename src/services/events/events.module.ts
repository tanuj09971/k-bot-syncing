import { Logger, Module } from "@nestjs/common";
import { EventsService } from "./events.service";
import { Web3Module } from "src/web3/web3.module";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { Web3Service } from "src/web3/web3.service";
import { TemporalJobModule } from "../temporal/temporal.module";
import { PingPongService } from "../pingPong/pingPong.service";
import { EventsController } from "./events.contoller";

@Module({
  imports: [Web3Module, TemporalJobModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    PrismaService,
    ConfigService,
    Web3Service,
    Logger,
    PingPongService,
  ],
})
export class EventModule {}
