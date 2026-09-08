import { ServiceUnavailableException } from '@nestjs/common';
import { generatePermalink } from './permalink';
import { DatabaseService } from '../database/database.service';

describe('generatePermalink', () => {
  const makeDb = (findUnique: jest.Mock) =>
    ({ quiz: { findUnique } }) as unknown as DatabaseService;

  it('returns a 6-character alphanumeric string when the first candidate is free', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);

    const permalink = await generatePermalink(makeDb(findUnique));

    expect(permalink).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(findUnique).toHaveBeenCalledTimes(1);
  });

  it('retries past a collision', async () => {
    const findUnique = jest
      .fn()
      .mockResolvedValueOnce({ id: 'taken' })
      .mockResolvedValueOnce(null);

    const permalink = await generatePermalink(makeDb(findUnique));

    expect(permalink).toMatch(/^[A-Za-z0-9]{6}$/);
    expect(findUnique).toHaveBeenCalledTimes(2);
  });

  it('throws after exhausting the retry cap', async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: 'taken' });

    await expect(generatePermalink(makeDb(findUnique))).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(findUnique).toHaveBeenCalledTimes(10);
  });
});
