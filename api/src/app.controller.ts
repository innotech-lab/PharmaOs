import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      name: 'PharmaOS API',
      status: 'ok',
      message: 'Bienvenue sur PharmaOS',
      endpoints: {
        health: '/health',
        sales: '/sales',
        reports: '/reports/dashboard',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
