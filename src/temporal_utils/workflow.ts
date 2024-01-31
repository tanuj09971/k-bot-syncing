import { proxyActivities } from '@temporalio/workflow';
import { PingActivity, PongActivity } from 'src/services/temporal/activities/ping-pong-activites';

// Incrementally watch blocks and filter ping events using topic and create ping records in database for further processing
// It does not submit any pong transcation
const { watchBlockForPingTransactions } = proxyActivities<PingActivity>({
  startToCloseTimeout: '10m',
});

// Look for un-processed ping event records in DB
// Assign a nonce
// Create pong transaction
// Maintain only-one pong txn for every ping by tying up every nounce with one ping event which eliminates possibility of sending multiple pongs for a single ping
// Retries until pong transaction is successfull
const { executeUnprocessedPongTransactions } = proxyActivities<PongActivity>({
  startToCloseTimeout: '10m',
});

export async function watcherForPingEventsSyncing(): Promise<void> {
  return watchBlockForPingTransactions();
}

export async function watcherForPongEventsEmitting(): Promise<void> {
  return executeUnprocessedPongTransactions();
}
