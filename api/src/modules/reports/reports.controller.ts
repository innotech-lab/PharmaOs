import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ReportsService } from './reports.service';

@UseGuards(AuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}
  @Get('summary') summary(@Req() req: any, @Query() query: Record<string, string>) {
    return this.reports.summary(req.user.tenantId, req.user.pharmacyId, query);
  }
}
