import { Injectable, NestMiddleware } from '@nestjs/common';
import { LoggerService } from '../../logger/logger.service';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly loggerService: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();
    const { method, url, headers, query } = req;
    const body: unknown = req.body;

    res.on('finish', () => {
      const responseTime = Date.now() - start;
      const message = `${method} - ${url} ${res.statusCode} - ${responseTime}ms`;
      const statusCode = res.statusCode;
      const logData = {
        responseTime,
        method,
        url,
        headers,
        query,
        body,
      };

      if (statusCode >= 500) {
        this.loggerService.error(message, undefined, `HTTP`, logData);
      } else if (statusCode >= 400) {
        this.loggerService.warn(message, `HTTP`, logData);
      } else {
        this.loggerService.log(message, `HTTP`, logData);
      }
    });

    next();
  }
}
