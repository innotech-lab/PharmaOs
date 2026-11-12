import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { SuppliersService } from './suppliers.service';

@UseGuards(AuthGuard)
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}
  @Get() list(@Req() req: any) {
    return this.suppliers.list(req.user.tenantId);
  }
  @Post() create(@Req() req: any, @Body() body: unknown) {
    return this.suppliers.create(req.user.tenantId, body);
  }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    return this.suppliers.update(req.user.tenantId, id, body);
  }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) {
    return this.suppliers.remove(req.user.tenantId, id);
  }
}
