import { Module } from '@nestjs/common';
import { PingPongService } from './pingPong.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [],
  controllers: [],
  providers: [PingPongService, PrismaService],
})
export class PingPongModule {}
