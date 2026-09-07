import {
  Global,
  Module,
  MiddlewareConsumer,
  NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './logger/logger.service';
import configuration from '../config';
import { LoggerMiddleware } from './middleware/logger/logger.middleware';
import { ResponseInterceptor } from './interceptors/response.interceptor';
import { DatabaseModule } from '../database/database.module';
import { HealthModule } from '../health/health.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      expandVariables: true,
    }),
    DatabaseModule,
    HealthModule,
  ],
  providers: [
    LoggerService,
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
  ],
  exports: [LoggerService],
})
export class CoreModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
