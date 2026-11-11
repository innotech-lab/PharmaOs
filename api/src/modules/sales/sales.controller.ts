import { Body, Controller, Get, Post, Param, Query } from '@nestjs/common';
import { SaleCreatePayload } from '@pharmaos/shared';
import { SalesService } from './sales.service';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('catalog')
  getCatalog(@Query('search') search?: string) {
    return this.salesService.getCatalog(search);
  }

  @Post()
  createSale(@Body() payload: SaleCreatePayload) {
    return this.salesService.createSale(payload);
  }

  @Post(':id/cancel')
  cancelSale(@Param('id') id: string) {
    return this.salesService.cancelSale(id);
  }
}
