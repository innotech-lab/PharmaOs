import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  getDashboard(@Query('pharmacyId') pharmacyId?: string) {
    return this.reportsService.getDashboardMetrics(pharmacyId);
  }
}
