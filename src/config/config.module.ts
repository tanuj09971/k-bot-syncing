import * as Joi from "@hapi/joi";
import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import config from "src/config/config";

const CONFIG_SCHEMA = Joi.object({
  name: Joi.string(),
  contractAbi: Joi.string(),
  contractAddress: Joi.string(),
  web3NodeUrl: Joi.array().items(Joi.string()),
  fromBlock: Joi.number(),
}).options({ abortEarly: false });

/**
 * Import and provide app configuration related classes.
 *
 * @module
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      ignoreEnvFile: false,
      load: [config],
      validationSchema: CONFIG_SCHEMA,
      isGlobal: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
