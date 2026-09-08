import { ServiceUnavailableException } from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import { DatabaseService } from '../database/database.service';

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const PERMALINK_LENGTH = 6;
const MAX_ATTEMPTS = 10;

const nano = customAlphabet(ALPHABET, PERMALINK_LENGTH);

/**
 * Generates a random 6-character alphanumeric permalink that is not already
 * taken by another quiz. Retries on collision up to {@link MAX_ATTEMPTS} times
 * before giving up.
 */
export async function generatePermalink(db: DatabaseService): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = nano();
    const existing = await db.quiz.findUnique({
      where: { permalink: candidate },
      select: { id: true },
    });
    if (!existing) {
      return candidate;
    }
  }
  throw new ServiceUnavailableException(
    'Could not generate a unique permalink, please retry',
  );
}
