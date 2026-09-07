import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('returns service metadata with docs and health pointers', () => {
      expect(appController.getInfo()).toEqual({
        name: 'quiz-builder-api',
        version: '1.0.0',
        docs: '/docs',
        health: '/health',
      });
    });
  });
});
