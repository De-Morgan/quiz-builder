import jwtConfig from './jwt.config';

describe('jwtConfig', () => {
  const original = process.env;

  beforeEach(() => {
    process.env = { ...original };
    process.env.JWT_SECRET = 'x'.repeat(32);
    process.env.JWT_EXPIRES_IN = '3600';
    process.env.JWT_TOKEN_AUDIENCE = 'localhost:3001';
    process.env.JWT_TOKEN_ISSUER = 'localhost:3001';
  });

  afterAll(() => {
    process.env = original;
  });

  it('returns the parsed config for a valid environment', () => {
    expect(jwtConfig()).toEqual({
      secret: 'x'.repeat(32),
      audience: 'localhost:3001',
      issuer: 'localhost:3001',
      expiresIn: 3600,
    });
  });

  it('defaults the expiry to 3600 when JWT_EXPIRES_IN is unset', () => {
    delete process.env.JWT_EXPIRES_IN;

    expect(jwtConfig().expiresIn).toBe(3600);
  });

  it('throws when the secret is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => jwtConfig()).toThrow(/Invalid JWT config/);
  });

  it('throws when the secret is shorter than 32 characters', () => {
    process.env.JWT_SECRET = 'too-short';

    expect(() => jwtConfig()).toThrow(/Invalid JWT config/);
  });

  it('throws when the expiry is not an integer', () => {
    process.env.JWT_EXPIRES_IN = 'not-a-number';

    expect(() => jwtConfig()).toThrow(/Invalid JWT config/);
  });
});
