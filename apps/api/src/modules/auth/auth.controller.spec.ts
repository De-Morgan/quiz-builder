import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
    me: jest.Mock;
  };

  const authResponse = {
    accessToken: 'token',
    user: { id: 'user-1', email: 'maya@example.com' },
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue(authResponse),
      login: jest.fn().mockResolvedValue(authResponse),
      me: jest.fn().mockResolvedValue(authResponse.user),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get(AuthController);
  });

  it('delegates register to AuthService', async () => {
    const dto = { email: 'maya@example.com', password: 'hunter2' };

    await expect(controller.create(dto)).resolves.toBe(authResponse);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to AuthService', async () => {
    const dto = { email: 'maya@example.com', password: 'hunter2' };

    await expect(controller.login(dto)).resolves.toBe(authResponse);
    expect(authService.login).toHaveBeenCalledWith(dto);
  });

  it('delegates me to AuthService using the current user id', async () => {
    await expect(
      controller.me({ id: 'user-1', email: 'maya@example.com' }),
    ).resolves.toBe(authResponse.user);
    expect(authService.me).toHaveBeenCalledWith('user-1');
  });
});
