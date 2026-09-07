import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { DatabaseService } from '../../src/database/database.service';

export interface TestContext {
  app: INestApplication;
  db: DatabaseService;
}

/**
 * Boots the full Nest application wired the same way as `main.ts`
 * (global `ValidationPipe`) against the database in `DATABASE_URL`.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.init();

  return { app, db: app.get(DatabaseService) };
}

/**
 * Wipes all domain data. Deleting users cascades to quizzes → questions →
 * answers via the `onDelete: Cascade` relations in the Prisma schema.
 */
export async function resetDb(db: DatabaseService): Promise<void> {
  await db.user.deleteMany();
}
