import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SuppliersController],
  providers: [SuppliersService, PrismaService, AuthGuard],
})
export class SuppliersModule {}
