import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
} from "@nestjs/terminus";
import { TcpOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
    private config: ConfigService
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () =>
        this.microservice.pingCheck<TcpOptions>("temporal", {
          transport: Transport.TCP,
          options: {
            host: process.env.TEMPORAL_HOST,
            port: 7233,
          },
        }),
      () =>
        this.microservice.pingCheck<TcpOptions>("postgres", {
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
