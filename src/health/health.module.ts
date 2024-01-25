import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "./health.controller";
import { AppConfigModule } from "src/config/config.module";

@Module({
  controllers: [HealthController],
  imports: [AppConfigModule, TerminusModule],
  providers: [],
})
export class HealthModule {}
