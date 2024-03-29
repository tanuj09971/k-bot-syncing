import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, MicroserviceHealthIndicator } from "@nestjs/terminus";
import { TcpOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { Service } from "src/services/events/utils/utils";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private microservice: MicroserviceHealthIndicator,
    private config: ConfigService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    const temporalHost = this.config.get(Service.TemporalHost);
    return this.health.check([
      () =>
        this.microservice.pingCheck<TcpOptions>(Service.Temporal, {
          transport: Transport.TCP,
          options: {
            host: temporalHost.split(":")[0],
            port: temporalHost.split(":")[1],
          },
        }),
      () =>
        this.microservice.pingCheck<TcpOptions>(Service.Postgres, {
          transport: Transport.TCP,
          options: {
            host: process.env.DATABASE_URL.split("@")[1].split(":")[0],
            port: Number(process.env.DATABASE_URL.split(":")[3].split("/")[0]),
          },
        }),
    ]);
  }

  @Get("status")
  is_up() {
    return "ok";
  }
}
