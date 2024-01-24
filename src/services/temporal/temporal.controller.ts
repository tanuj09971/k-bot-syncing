import { Controller, Logger } from "@nestjs/common";
import { WorkflowClient } from "@temporalio/client";
import { InjectTemporalClient } from "nestjs-temporal";

@Controller("temporal")
export class TemporalController {
  constructor(
    @InjectTemporalClient() private readonly temporalClient: WorkflowClient,
    private logger: Logger
  ) {}
  async checkAndTerminateWorkflow(workflowId: string) {
    try {
      const handle = this.temporalClient.getHandle(workflowId);
      const description = await handle.describe();
      if (description.status.name === "RUNNING") {
        await handle.terminate("Your termination reason");
        this.logger.log(`Workflow ${workflowId} terminated successfully.`);
      } else {
        this.logger.log(`Workflow ${workflowId} is not running.`);
      }
    } catch (error) {
      this.logger.error(
        `Error while checking and terminating workflow: ${error}`
      );
    }
  }
  async onModuleInit() {
    this.checkAndTerminateWorkflow("wf-ping");
    this.checkAndTerminateWorkflow("wf-pong-failed");
    this.checkAndTerminateWorkflow("wf-pong");
    this.checkAndTerminateWorkflow("wf-pong-in-progress");

    const handle = await this.temporalClient.start(
      "watcherForPingEventsSyncing",
      {
        args: [],
        taskQueue: "default",
        workflowId: "wf-ping",
        cronSchedule: "* * * * *",
        retry: {
          maximumAttempts: 3,
        },
      }
    );
    this.logger.log(`Started workflow ${handle.workflowId}`);
    const pongHandle = await this.temporalClient.start(
      "watcherForPongEventsEmitting",
      {
        args: [],
        taskQueue: "default",
        startDelay: 2000,
        workflowId: "wf-pong",
        cronSchedule: "* * * * *",
        retry: {
          maximumAttempts: 3,
        },
      }
    );
    this.logger.log(`Started workflow ${pongHandle.workflowId}`);
    const pongFailedHandle = await this.temporalClient.start(
      "watcherForFailedPongEventsEmitting",
      {
        args: [],
        taskQueue: "default",
        workflowId: "wf-pong-failed",
        cronSchedule: "* * * * *",
        retry: {
          maximumAttempts: 3,
        },
      }
    );
    this.logger.log(`Started workflow ${pongFailedHandle.workflowId}`);
    const pongInProgressHandle = await this.temporalClient.start(
      "watcherForinProgressPongEventsEmitting",
      {
        args: [],
        taskQueue: "default",
        workflowId: "wf-pong-in-progress",
        cronSchedule: "* * * * *",
        retry: {
          maximumAttempts: 3,
        },
      }
    );
    this.logger.log(`Started workflow ${pongInProgressHandle.workflowId}`);
  }
}
