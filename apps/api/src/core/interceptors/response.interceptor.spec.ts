import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();

  const buildContext = (url: string, statusCode: number): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ url }),
        getResponse: () => ({ statusCode }),
      }),
    }) as unknown as ExecutionContext;

  it('wraps the handler result in the standard envelope', async () => {
    const next: CallHandler = { handle: () => of({ id: 'user-1' }) };

    const result = await lastValueFrom(
      interceptor.intercept(buildContext('/auth/me', 200), next),
    );

    expect(result).toEqual({
      success: true,
      statusCode: 200,
      path: '/auth/me',
      data: { id: 'user-1' },
    });
  });

  it('reflects the response status code and request path', async () => {
    const next: CallHandler = { handle: () => of('created') };

    const result = await lastValueFrom(
      interceptor.intercept(buildContext('/auth/register', 201), next),
    );

    expect(result).toMatchObject({
      statusCode: 201,
      path: '/auth/register',
      data: 'created',
    });
  });
});
