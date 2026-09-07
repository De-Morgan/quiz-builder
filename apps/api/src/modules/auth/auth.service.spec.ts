import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../../database/database.service';
import { HashingService } from '../../services/hashing/hashing.service';

describe('AuthService', () => {
  let service: AuthService;
  let db: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let hashing: { hash: jest.Mock; compare: jest.Mock };
  let jwt: { sign: jest.Mock };

  const storedUser = {
    id: 'user-1',
    email: 'maya@example.com',
    passwordHash: 'hashed-pw',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    db = { user: { findUnique: jest.fn(), create: jest.fn() } };
    hashing = { hash: jest.fn(), compare: jest.fn() };
    jwt = { sign: jest.fn().mockReturnValue('signed-token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: db },
        { provide: HashingService, useValue: hashing },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('creates a user, hashing the password and normalising the email', async () => {
      db.user.findUnique.mockResolvedValue(null);
      hashing.hash.mockResolvedValue('hashed-pw');
      db.user.create.mockResolvedValue(storedUser);

      const result = await service.register({
        email: '  Maya@Example.com ',
        password: 'hunter2',
      });

      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'maya@example.com' },
      });
      expect(hashing.hash).toHaveBeenCalledWith('hunter2');
      expect(db.user.create).toHaveBeenCalledWith({
        data: { email: 'maya@example.com', passwordHash: 'hashed-pw' },
      });
      expect(jwt.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'maya@example.com',
      });
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 'user-1', email: 'maya@example.com' },
      });
    });

    it('rejects a duplicate email with a ConflictException', async () => {
      db.user.findUnique.mockResolvedValue(storedUser);

      await expect(
        service.register({ email: 'maya@example.com', password: 'hunter2' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(db.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns an auth response for valid credentials', async () => {
      db.user.findUnique.mockResolvedValue(storedUser);
      hashing.compare.mockResolvedValue(true);

      const result = await service.login({
        email: 'maya@example.com',
        password: 'hunter2',
      });

      expect(hashing.compare).toHaveBeenCalledWith('hunter2', 'hashed-pw');
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: { id: 'user-1', email: 'maya@example.com' },
      });
    });

    it('throws UnauthorizedException when the user does not exist', async () => {
      db.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when the password does not match', async () => {
      db.user.findUnique.mockResolvedValue(storedUser);
      hashing.compare.mockResolvedValue(false);

      await expect(
        service.login({ email: 'maya@example.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getUserById', () => {
    it('returns a safe user without the password hash', async () => {
      db.user.findUnique.mockResolvedValue(storedUser);

      await expect(service.getUserById('user-1')).resolves.toEqual({
        id: 'user-1',
        email: 'maya@example.com',
      });
    });

    it('throws UnauthorizedException when the user is missing', async () => {
      db.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('ghost')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
