import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { ScoringService } from './scoring.service';

@Module({
  controllers: [PublicController],
  providers: [PublicService, ScoringService],
})
export class PublicModule {}
