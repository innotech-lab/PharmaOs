import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, ProductsModule, InventoryModule], providers: [PrismaService] })
export class AppModule {}
