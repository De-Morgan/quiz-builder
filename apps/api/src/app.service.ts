import { Injectable } from '@nestjs/common';

export interface ServiceInfo {
  name: string;
  version: string;
  docs: string;
  health: string;
}

@Injectable()
export class AppService {
  getInfo(): ServiceInfo {
    return {
      name: 'quiz-builder-api',
      version: '1.0.0',
      docs: '/docs',
      health: '/health',
    };
  }
}
