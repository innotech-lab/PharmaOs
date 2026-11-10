import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [ProductsController],
  providers: [ProductsService, PrismaService, AuthGuard],
})
export class ProductsModule {}
