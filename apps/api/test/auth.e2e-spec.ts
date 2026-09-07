import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { DatabaseService } from '../src/database/database.service';
import { createTestApp, resetDb } from './utils/e2e';

interface AuthPayload {
  accessToken: string;
  user: { id: string; email: string };
}

// The global ResponseInterceptor wraps every success body as
// `{ success, statusCode, path, data }`.
const dataOf = <T>(res: request.Response): T => (res.body as { data: T }).data;

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  let http: App;

  const credentials = { email: 'maya@example.com', password: 'hunter2' };

  const register = (body: Record<string, unknown>) =>
    request(http).post('/auth/register').send(body);
  const login = (body: Record<string, unknown>) =>
    request(http).post('/auth/login').send(body);

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

  describe('POST /auth/register', () => {
    it('creates a user and returns an access token', async () => {
      const res = await register(credentials).expect(201);
      const payload = dataOf<AuthPayload>(res);

      expect(typeof payload.accessToken).toBe('string');
      expect(typeof payload.user.id).toBe('string');
      expect(payload.user.email).toBe('maya@example.com');

      const stored = await db.user.findUnique({
        where: { email: 'maya@example.com' },
      });
      expect(stored).not.toBeNull();
      expect(stored?.passwordHash).not.toBe('hunter2');
    });

    it('normalises the email to lowercase', async () => {
      const res = await register({
        email: 'Maya@Example.COM',
        password: 'hunter2',
      }).expect(201);

      expect(dataOf<AuthPayload>(res).user.email).toBe('maya@example.com');
      expect(
        await db.user.findUnique({ where: { email: 'maya@example.com' } }),
      ).not.toBeNull();
    });

    it('rejects a duplicate email with 409', async () => {
      await register(credentials).expect(201);
      await register(credentials).expect(409);
      await register({ ...credentials, email: 'MAYA@example.com' }).expect(409);

      expect(await db.user.count()).toBe(1);
    });

    it('rejects a malformed email with 400', async () => {
      await register({ email: 'not-an-email', password: 'hunter2' }).expect(
        400,
      );
    });

    it('rejects a password shorter than 6 characters with 400', async () => {
      await register({ email: 'maya@example.com', password: 'short' }).expect(
        400,
      );
      expect(await db.user.count()).toBe(0);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await register(credentials).expect(201);
    });

    it('returns an access token for valid credentials', async () => {
      const res = await login(credentials).expect(200);
      expect(typeof dataOf<AuthPayload>(res).accessToken).toBe('string');
    });

    it('accepts a differently-cased email', async () => {
      await login({ ...credentials, email: 'Maya@Example.com' }).expect(200);
    });

    it('returns 401 for a wrong password', async () => {
      await login({ ...credentials, password: 'wrong' }).expect(401);
    });

    it('returns 401 for an unknown email', async () => {
      await login({ email: 'ghost@example.com', password: 'hunter2' }).expect(
        401,
      );
    });

    it('returns 400 when a field is missing', async () => {
      await login({ email: 'maya@example.com' }).expect(400);
    });
  });

  describe('GET /auth/me', () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
      const res = await register(credentials).expect(201);
      const payload = dataOf<AuthPayload>(res);
      token = payload.accessToken;
      userId = payload.user.id;
    });

    it('returns the current user for a valid bearer token', async () => {
      const res = await request(http)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(dataOf<AuthPayload['user']>(res)).toEqual({
        id: userId,
        email: 'maya@example.com',
      });
    });

    it('never leaks the password hash', async () => {
      const res = await request(http)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
    });

    it('returns 401 without a token', async () => {
      await request(http).get('/auth/me').expect(401);
    });

    it('returns 401 for a malformed token', async () => {
      await request(http)
        .get('/auth/me')
        .set('Authorization', 'Bearer not.a.jwt')
        .expect(401);
    });

    it('returns 401 for an expired token', async () => {
      const jwt = app.get(JwtService);
      const expired = jwt.sign(
        { sub: userId, email: credentials.email },
        { expiresIn: -10 },
      );

      await request(http)
        .get('/auth/me')
        .set('Authorization', `Bearer ${expired}`)
        .expect(401);
    });

    it('returns 401 once the user has been deleted', async () => {
      await db.user.delete({ where: { id: userId } });

      await request(http)
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });
});
