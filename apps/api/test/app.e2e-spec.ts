import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET) returns service metadata', async () => {
    const res = await request(app.getHttpServer()).get('/').expect(200);
    const body = res.body as { data: unknown };
    expect(body.data).toEqual({
      name: 'quiz-builder-api',
      version: '1.0.0',
      docs: '/docs',
      health: '/health',
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
