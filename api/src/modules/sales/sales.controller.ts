import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SalesService } from './sales.service';

@UseGuards(AuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}
  @Get() list(@Req() req: any, @Query('limit') limit?: string) {
    return this.sales.list(req.user.tenantId, req.user.pharmacyId, Number(limit ?? 20));
  }
  @Post() checkout(@Req() req: any, @Body() body: unknown) {
    return this.sales.checkout(req.user.tenantId, req.user.pharmacyId, req.user.sub, body);
  }
  @Post(':id/cancel') cancel(@Req() req: any, @Param('id') id: string) {
    return this.sales.cancel(req.user.tenantId, req.user.pharmacyId, req.user.role, id);
  }
}
