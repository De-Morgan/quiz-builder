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

describe('Quizzes (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  let http: App;

  const registerUser = async (email: string): Promise<string> => {
    const res = await request(http)
      .post('/auth/register')
      .send({ email, password: 'hunter2' })
      .expect(201);
    return dataOf<{ accessToken: string }>(res).accessToken;
  };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

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

  describe('authentication', () => {
    it('rejects every route without a token', async () => {
      await request(http).get('/quizzes').expect(401);
      await request(http).post('/quizzes').send(quizBody()).expect(401);
      await request(http).get('/quizzes/x').expect(401);
      await request(http).patch('/quizzes/x').send(quizBody()).expect(401);
      await request(http).delete('/quizzes/x').expect(401);
      await request(http).post('/quizzes/x/publish').expect(401);
    });
  });

  describe('create + read', () => {
    let token: string;

    beforeEach(async () => {
      token = await registerUser('maya@example.com');
    });

    it('creates a quiz and lists it, exposing isCorrect to the owner', async () => {
      const created = await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send(quizBody())
        .expect(201);
      const quiz = dataOf<{ id: string }>(created);

      const list = await request(http)
        .get('/quizzes')
        .set(auth(token))
        .expect(200);
      expect(dataOf<unknown[]>(list)).toHaveLength(1);
      expect(dataOf<{ questionCount: number }[]>(list)[0]!.questionCount).toBe(
        2,
      );

      const detail = await request(http)
        .get(`/quizzes/${quiz.id}`)
        .set(auth(token))
        .expect(200);
      const body = dataOf<{
        questions: { answers: { isCorrect: boolean }[] }[];
      }>(detail);
      expect(body.questions[0]!.answers[0]).toHaveProperty('isCorrect', true);
    });

    it.each([
      ['no questions', { title: 't', questions: [] }],
      [
        '11 questions',
        {
          title: 't',
          questions: Array.from({ length: 11 }, (_, i) => ({
            text: `q${i}`,
            type: 'SINGLE',
            answers: [
              { text: 'a', isCorrect: true },
              { text: 'b', isCorrect: false },
            ],
          })),
        },
      ],
      [
        'a question with a single answer',
        {
          title: 't',
          questions: [
            {
              text: 'q',
              type: 'SINGLE',
              answers: [{ text: 'a', isCorrect: true }],
            },
          ],
        },
      ],
      [
        'two questions with the same text',
        {
          title: 't',
          questions: [
            {
              text: 'Same',
              type: 'SINGLE',
              answers: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
              ],
            },
            {
              text: ' same ',
              type: 'SINGLE',
              answers: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
              ],
            },
          ],
        },
      ],
      [
        'a question with two identical answers',
        {
          title: 't',
          questions: [
            {
              text: 'q',
              type: 'SINGLE',
              answers: [
                { text: 'a', isCorrect: true },
                { text: ' A ', isCorrect: false },
              ],
            },
          ],
        },
      ],
      [
        'a question with 6 answers',
        {
          title: 't',
          questions: [
            {
              text: 'q',
              type: 'MULTIPLE',
              answers: Array.from({ length: 6 }, (_, i) => ({
                text: `a${i}`,
                isCorrect: i === 0,
              })),
            },
          ],
        },
      ],
      [
        'a SINGLE question with two correct answers',
        {
          title: 't',
          questions: [
            {
              text: 'q',
              type: 'SINGLE',
              answers: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: true },
              ],
            },
          ],
        },
      ],
    ])('rejects %s with 400', async (_label, body) => {
      await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send(body)
        .expect(400);
    });
  });

  describe('publish + immutability', () => {
    let token: string;
    let quizId: string;

    beforeEach(async () => {
      token = await registerUser('maya@example.com');
      const res = await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send(quizBody())
        .expect(201);
      quizId = dataOf<{ id: string }>(res).id;
    });

    it('publishes with a 6-character permalink then blocks re-publish and edits', async () => {
      const published = await request(http)
        .post(`/quizzes/${quizId}/publish`)
        .set(auth(token))
        .expect(200);
      expect(dataOf<{ permalink: string }>(published).permalink).toMatch(
        /^[A-Za-z0-9]{6}$/,
      );

      await request(http)
        .post(`/quizzes/${quizId}/publish`)
        .set(auth(token))
        .expect(409);

      await request(http)
        .patch(`/quizzes/${quizId}`)
        .set(auth(token))
        .send(quizBody())
        .expect(409);
    });

    it('deletes a published quiz and then 404s on read', async () => {
      await request(http)
        .post(`/quizzes/${quizId}/publish`)
        .set(auth(token))
        .expect(200);
      await request(http)
        .delete(`/quizzes/${quizId}`)
        .set(auth(token))
        .expect(204);
      await request(http)
        .get(`/quizzes/${quizId}`)
        .set(auth(token))
        .expect(404);
    });
  });

  describe('draft question editing', () => {
    let token: string;
    let quizId: string;

    beforeEach(async () => {
      token = await registerUser('maya@example.com');
      const res = await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send(quizBody())
        .expect(201);
      quizId = dataOf<{ id: string }>(res).id;
    });

    const extraQuestion = {
      text: 'Largest ocean?',
      type: 'SINGLE',
      answers: [
        { text: 'Pacific', isCorrect: true },
        { text: 'Atlantic', isCorrect: false },
      ],
    };

    it('adds and removes a question on a draft, then 409s once published', async () => {
      const added = await request(http)
        .post(`/quizzes/${quizId}/questions`)
        .set(auth(token))
        .send(extraQuestion)
        .expect(201);
      const withThree = dataOf<{ questions: { id: string }[] }>(added);
      expect(withThree.questions).toHaveLength(3);

      const removed = await request(http)
        .delete(`/quizzes/${quizId}/questions/${withThree.questions[0]!.id}`)
        .set(auth(token))
        .expect(200);
      expect(dataOf<{ questions: unknown[] }>(removed).questions).toHaveLength(
        2,
      );

      await request(http)
        .post(`/quizzes/${quizId}/publish`)
        .set(auth(token))
        .expect(200);

      await request(http)
        .post(`/quizzes/${quizId}/questions`)
        .set(auth(token))
        .send(extraQuestion)
        .expect(409);
      const detail = await request(http)
        .get(`/quizzes/${quizId}`)
        .set(auth(token))
        .expect(200);
      const qid = dataOf<{ questions: { id: string }[] }>(detail).questions[0]!
        .id;
      await request(http)
        .delete(`/quizzes/${quizId}/questions/${qid}`)
        .set(auth(token))
        .expect(409);
    });

    it('rejects a duplicate question text with 400', async () => {
      await request(http)
        .post(`/quizzes/${quizId}/questions`)
        .set(auth(token))
        .send({ ...extraQuestion, text: 'capital of france?' })
        .expect(400);
    });

    it('rejects a question with duplicate answer text with 400', async () => {
      await request(http)
        .post(`/quizzes/${quizId}/questions`)
        .set(auth(token))
        .send({
          ...extraQuestion,
          answers: [
            { text: 'Pacific', isCorrect: true },
            { text: 'pacific', isCorrect: false },
          ],
        })
        .expect(400);
    });

    it('hides another user’s quiz behind 404 for the question routes', async () => {
      const bob = await registerUser('bob@example.com');
      await request(http)
        .post(`/quizzes/${quizId}/questions`)
        .set(auth(bob))
        .send(extraQuestion)
        .expect(404);
      await request(http)
        .delete(`/quizzes/${quizId}/questions/anything`)
        .set(auth(bob))
        .expect(404);
    });
  });

  describe('duplicate quiz titles', () => {
    it('lets one owner keep several quizzes with the same title', async () => {
      const token = await registerUser('maya@example.com');
      await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send(quizBody())
        .expect(201);
      await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send({ ...quizBody(), title: 'GENERAL knowledge' })
        .expect(201);

      const list = await request(http)
        .get('/quizzes')
        .set(auth(token))
        .expect(200);
      expect(dataOf<unknown[]>(list)).toHaveLength(2);
    });
  });

  describe('partial update', () => {
    let token: string;
    let quizId: string;

    beforeEach(async () => {
      token = await registerUser('maya@example.com');
      const res = await request(http)
        .post('/quizzes')
        .set(auth(token))
        .send(quizBody())
        .expect(201);
      quizId = dataOf<{ id: string }>(res).id;
    });

    const detail = async () =>
      dataOf<{ title: string; questions: unknown[] }>(
        await request(http)
          .get(`/quizzes/${quizId}`)
          .set(auth(token))
          .expect(200),
      );

    it('updates the title without touching questions', async () => {
      await request(http)
        .patch(`/quizzes/${quizId}`)
        .set(auth(token))
        .send({ title: 'Renamed' })
        .expect(200);

      const body = await detail();
      expect(body.title).toBe('Renamed');
      expect(body.questions).toHaveLength(2);
    });

    it('replaces questions without touching the title', async () => {
      await request(http)
        .patch(`/quizzes/${quizId}`)
        .set(auth(token))
        .send({
          questions: [
            {
              text: 'Only question',
              type: 'SINGLE',
              answers: [
                { text: 'a', isCorrect: true },
                { text: 'b', isCorrect: false },
              ],
            },
          ],
        })
        .expect(200);

      const body = await detail();
      expect(body.title).toBe('General knowledge');
      expect(body.questions).toHaveLength(1);
    });

    it('rejects an empty body with 400', async () => {
      await request(http)
        .patch(`/quizzes/${quizId}`)
        .set(auth(token))
        .send({})
        .expect(400);
    });

    it('rejects an empty questions array with 400', async () => {
      await request(http)
        .patch(`/quizzes/${quizId}`)
        .set(auth(token))
        .send({ questions: [] })
        .expect(400);
    });
  });

  describe('cross-user isolation', () => {
    it('hides another user’s quiz behind 404 for every route', async () => {
      const alice = await registerUser('alice@example.com');
      const bob = await registerUser('bob@example.com');

      const res = await request(http)
        .post('/quizzes')
        .set(auth(alice))
        .send(quizBody())
        .expect(201);
      const quizId = dataOf<{ id: string }>(res).id;

      await request(http).get(`/quizzes/${quizId}`).set(auth(bob)).expect(404);
      await request(http)
        .patch(`/quizzes/${quizId}`)
        .set(auth(bob))
        .send(quizBody())
        .expect(404);
      await request(http)
        .delete(`/quizzes/${quizId}`)
        .set(auth(bob))
        .expect(404);
      await request(http)
        .post(`/quizzes/${quizId}/publish`)
        .set(auth(bob))
        .expect(404);

      const list = await request(http)
        .get('/quizzes')
        .set(auth(bob))
        .expect(200);
      expect(dataOf<unknown[]>(list)).toHaveLength(0);
    });
  });
});
