import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { Web3Module } from './web3/web3.module';
import { EventModule } from './services/events/events.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TemporalModule } from 'nestjs-temporal';
import { bundleWorkflowCode, NativeConnection, Runtime } from '@temporalio/worker';
import { TemporalJobModule } from './services/temporal/temporal.module';
import { HealthModule } from './health/health.module';
import { PingPongModule } from './services/pingPong/pingPong.module';

@Module({
  imports: [
    TemporalJobModule,
    AppConfigModule,
    Web3Module,
    EventModule,
    HealthModule,
    PingPongModule,
    TemporalModule.registerWorkerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        Runtime.install({});
        const temporalHost = config.get('temporalHost');
        const connection = await NativeConnection.connect({
          address: temporalHost,
        });
        const workflowBundle = await bundleWorkflowCode({
          workflowsPath: require.resolve('./temporal_utils/workflow'),
        });

        return {
          workerOptions: {
            connection,
            taskQueue: 'default',
            workflowBundle,
          },
          serverOptions: {
            address: 'temporal:7233',
          },
        };
      },
    }),

    TemporalModule.registerClient({
      connection: { address: 'temporal:7233' },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
