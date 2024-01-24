import { proxyActivities } from "@temporalio/workflow";
import {
  PingActivity,
  PongActivity,
  FailedPongActivity,
  InProgressPongActivity,
} from "src/services/temporal/activities/ping-pong-activites";

const { watchBlockForPingEvents } = proxyActivities<PingActivity>({
  startToCloseTimeout: "10m",
});

const { watchProcessedPongEvents } = proxyActivities<PongActivity>({
  startToCloseTimeout: "10m",
});

const { watchFailedEmitPongEvents } = proxyActivities<FailedPongActivity>({
  startToCloseTimeout: "10m",
});

const { watchInProgressPong } = proxyActivities<InProgressPongActivity>({
  startToCloseTimeout: "10m",
});

export async function watcherForPingEventsSyncing(): Promise<void> {
  return await watchBlockForPingEvents();
}

export async function watcherForPongEventsEmitting(): Promise<void> {
  return await watchProcessedPongEvents();
}

export async function watcherForFailedPongEventsEmitting(): Promise<void> {
  return await watchFailedEmitPongEvents();
}

export async function watcherForinProgressPongEventsEmitting(): Promise<void> {
  return await watchInProgressPong();
}
