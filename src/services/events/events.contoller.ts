import { Controller, Get } from "@nestjs/common";
import { EventsService } from "./events.service";

@Controller("event")
export class EventsController {
  constructor(private readonly eventService: EventsService) {}

  @Get("fetched-block")
  async getLastFetchedBlock() {
    return this.eventService.getLastProcessedBlock();
  }
}
