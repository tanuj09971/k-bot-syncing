import { THREE_MINUTES_IN_MILLISECONDS } from "src/services/temporal/types/interface";

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function isOlderThan3Minutes(updatedAt) {
  const currentTime = new Date();
  const timeDifference = currentTime.getTime() - new Date(updatedAt).getTime();
  return timeDifference > THREE_MINUTES_IN_MILLISECONDS;
}

export enum Service {
  TemporalHost = "temporalHost",
  Temporal = "temporal",
  Postgres = "postgres",
}

export const DELAY = 2000;
export const MAX_RETRIES = 3;