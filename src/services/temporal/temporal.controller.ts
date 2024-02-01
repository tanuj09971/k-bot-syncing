import { Controller, Logger } from "@nestjs/common";
import { WorkflowClient } from "@temporalio/client";
import { InjectTemporalClient } from "nestjs-temporal";
import { TemporalStatus } from "./types/interface";

@Controller("temporal")
export class TemporalController {
  constructor(
    @InjectTemporalClient() private readonly temporalClient: WorkflowClient,
    private logger: Logger,
  ) {}

  async checkAndTerminateWorkflow(workflowId: string) {
    try {
      const handle = this.temporalClient.getHandle(workflowId);
      const description = await handle.describe();
      if (description.status.name === TemporalStatus.RUNNING) {
        await handle.terminate(TemporalStatus.TERMINATED);
        this.logger.log(`Workflow ${workflowId} terminated successfully.`);
      } else {
        this.logger.log(`Workflow ${workflowId} is not running.`);
      }
    } catch (error) {
      this.logger.error(`Error while checking and terminating workflow: ${error}`);
    }
  }

  /**
   * Initialize and start workflows when the module is initialized.
   */
  async onModuleInit() {
    const workflows = [
      { id: "wf-ping", watcher: "PingEventsSyncing" },
      { id: "wf-pong", watcher: "PongEventsEmitting" },
    ];

    await Promise.all(
      workflows.map(async ({ id, watcher }) => {
        this.checkAndTerminateWorkflow(id);

        const handle = await this.temporalClient.start(`watcherFor${watcher}`, {
          args: [],
          taskQueue: "default",
          workflowId: id,
          cronSchedule: "* * * * *",
          retry: {
            maximumAttempts: 3,
          },
        });

        this.logger.log(`Started workflow ${handle.workflowId}`);
      }),
    );
  }
}
