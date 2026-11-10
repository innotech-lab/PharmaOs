import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ProductsService } from './products.service';

@UseGuards(AuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}
  @Get() list(@Req() req: any) {
    return this.products.list(req.user.tenantId, req.user.pharmacyId);
  }
  @Post() create(@Req() req: any, @Body() body: unknown) {
    return this.products.create(req.user.tenantId, req.user.pharmacyId, body);
  }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body() body: unknown) {
    return this.products.update(req.user.tenantId, req.user.pharmacyId, id, body);
  }
  @Delete(':id') deactivate(@Req() req: any, @Param('id') id: string) {
    return this.products.deactivate(req.user.tenantId, req.user.pharmacyId, id);
  }
}
