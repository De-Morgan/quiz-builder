import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { AuthModule } from './modules/auth/auth.module';
import { PublicModule } from './modules/public/public.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';

@Module({
  imports: [CoreModule, AuthModule, QuizzesModule, PublicModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
