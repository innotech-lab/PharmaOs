import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { InventoryService } from './inventory.service';

@UseGuards(AuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get('levels') levels(@Req() req: any) {
    return this.inventory.levels(req.user.tenantId, req.user.pharmacyId);
  }
  @Get('movements') movements(@Req() req: any) {
    return this.inventory.movements(req.user.tenantId, req.user.pharmacyId);
  }
  @Post('movements') create(@Req() req: any, @Body() body: unknown) {
    return this.inventory.createMovement(req.user.tenantId, req.user.pharmacyId, body);
  }
}
