import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { SalesModule } from './modules/sales/sales.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, ProductsModule, InventoryModule, SuppliersModule, SalesModule, ReportsModule], providers: [PrismaService] })
export class AppModule {}
