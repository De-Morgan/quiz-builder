import { BcryptService } from './bcrypt.service';

describe('BcryptService', () => {
  const service = new BcryptService();

  it('hashes a value to a bcrypt digest that is not the plaintext', async () => {
    const hash = await service.hash('hunter2');

    expect(hash).not.toBe('hunter2');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('compare returns true for a matching password', async () => {
    const hash = await service.hash('hunter2');

    await expect(service.compare('hunter2', hash)).resolves.toBe(true);
  });

  it('compare returns false for a non-matching password', async () => {
    const hash = await service.hash('hunter2');

    await expect(service.compare('wrong', hash)).resolves.toBe(false);
  });
});
