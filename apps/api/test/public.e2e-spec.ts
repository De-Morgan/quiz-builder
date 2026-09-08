import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { DatabaseService } from '../src/database/database.service';
import { createTestApp, resetDb } from './utils/e2e';

const dataOf = <T>(res: request.Response): T => (res.body as { data: T }).data;

const quizBody = () => ({
  title: 'General knowledge',
  questions: [
    {
      text: 'Capital of France?',
      type: 'SINGLE',
      answers: [
        { text: 'Paris', isCorrect: true },
        { text: 'Lyon', isCorrect: false },
      ],
    },
    {
      text: 'Pick the primes',
      type: 'MULTIPLE',
      answers: [
        { text: '2', isCorrect: true },
        { text: '3', isCorrect: true },
        { text: '4', isCorrect: false },
      ],
    },
  ],
});

interface Detail {
  id: string;
  questions: { id: string; type: string; answers: { id: string }[] }[];
}

describe('Public (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  let http: App;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const publishQuiz = async (): Promise<{
    permalink: string;
    detail: Detail;
  }> => {
    const reg = await request(http)
      .post('/auth/register')
      .send({ email: 'maya@example.com', password: 'hunter2' })
      .expect(201);
    const token = dataOf<{ accessToken: string }>(reg).accessToken;

    const created = await request(http)
      .post('/quizzes')
      .set(auth(token))
      .send(quizBody())
      .expect(201);
    const detail = dataOf<Detail>(created);

    const published = await request(http)
      .post(`/quizzes/${detail.id}/publish`)
      .set(auth(token))
      .expect(200);
    return {
      permalink: dataOf<{ permalink: string }>(published).permalink,
      detail,
    };
  };

  beforeAll(async () => {
    ({ app, db } = await createTestApp());
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await resetDb(db);
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  it('serves a published quiz with no auth and no correct-answer data', async () => {
    const { permalink } = await publishQuiz();

    const res = await request(http)
      .get(`/public/quizzes/${permalink}`)
      .expect(200);
    const body = dataOf<Detail & { title: string }>(res);

    expect(body.title).toBe('General knowledge');
    expect(body.questions).toHaveLength(2);
    expect(JSON.stringify(res.body)).not.toContain('isCorrect');
    expect(JSON.stringify(res.body)).not.toContain('ownerId');
  });

  it('404s for an unknown permalink', async () => {
    await request(http).get('/public/quizzes/ZZZZZZ').expect(404);
    await request(http)
      .post('/public/quizzes/ZZZZZZ/submit')
      .send({ answers: [{ questionId: 'x', answerIds: [] }] })
      .expect(404);
  });

  it('does not expose an unpublished quiz', async () => {
    const reg = await request(http)
      .post('/auth/register')
      .send({ email: 'drafter@example.com', password: 'hunter2' })
      .expect(201);
    const token = dataOf<{ accessToken: string }>(reg).accessToken;
    await request(http)
      .post('/quizzes')
      .set(auth(token))
      .send(quizBody())
      .expect(201);

    // No permalink exists for a draft; a guessed one 404s.
    await request(http).get('/public/quizzes/abcdef').expect(404);
  });

  it('scores a submission and persists nothing', async () => {
    const { permalink, detail } = await publishQuiz();
    const single = detail.questions.find((q) => q.type === 'SINGLE')!;
    const multi = detail.questions.find((q) => q.type === 'MULTIPLE')!;

    const perfect = await request(http)
      .post(`/public/quizzes/${permalink}/submit`)
      .send({
        answers: [
          { questionId: single.id, answerIds: [single.answers[0]!.id] },
          {
            questionId: multi.id,
            answerIds: [multi.answers[0]!.id, multi.answers[1]!.id],
          },
        ],
      })
      .expect(200);
    expect(dataOf<{ correct: number; total: number }>(perfect)).toEqual({
      correct: 2,
      total: 2,
    });

    const partial = await request(http)
      .post(`/public/quizzes/${permalink}/submit`)
      .send({
        answers: [
          { questionId: single.id, answerIds: [single.answers[1]!.id] },
          { questionId: multi.id, answerIds: [multi.answers[0]!.id] },
        ],
      })
      .expect(200);
    expect(dataOf<{ correct: number }>(partial).correct).toBe(0);

    // Re-fetching still works — no visitor state was stored.
    await request(http).get(`/public/quizzes/${permalink}`).expect(200);
  });

  it('rejects a malformed submission with 400', async () => {
    const { permalink } = await publishQuiz();
    await request(http)
      .post(`/public/quizzes/${permalink}/submit`)
      .send({ answers: [] })
      .expect(400);
    await request(http)
      .post(`/public/quizzes/${permalink}/submit`)
      .send({ answers: [{ questionId: 123 }] })
      .expect(400);
  });
});
