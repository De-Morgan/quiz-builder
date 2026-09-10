import { JwtStrategy } from './jwt.strategy';
import { AuthService } from '../auth.service';

describe('JwtStrategy', () => {
  const configuration = {
    secret: 'a'.repeat(32),
    audience: 'localhost:3001',
    issuer: 'localhost:3001',
    expiresIn: 3600,
  };

  it('resolves the payload subject to a user via AuthService', async () => {
    const user = { id: 'user-1', email: 'maya@example.com' };
    const getUserById = jest.fn().mockResolvedValue(user);
    const authService = {
      getUserById,
    } as unknown as AuthService;

    const strategy = new JwtStrategy(configuration, authService);

    await expect(
      strategy.validate({ sub: 'user-1', email: 'maya@example.com' }),
    ).resolves.toBe(user);
    expect(getUserById).toHaveBeenCalledWith('user-1');
  });

  it('propagates the rejection when the user cannot be found', async () => {
    const authService = {
      getUserById: jest.fn().mockRejectedValue(new Error('nope')),
    } as unknown as AuthService;

    const strategy = new JwtStrategy(configuration, authService);

    await expect(
      strategy.validate({ sub: 'ghost', email: 'ghost@example.com' }),
    ).rejects.toThrow('nope');
  });
});
