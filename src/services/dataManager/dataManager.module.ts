import { Module } from "@nestjs/common";
import { DataManagerService } from "./dataManager.service";
import { PrismaService } from "src/prisma/prisma.service";

@Module({
  imports: [],
  controllers: [],
  providers: [DataManagerService, PrismaService],
})
export class DataManagerModule {}
