import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [SalesController],
  providers: [SalesService, PrismaService, AuthGuard],
})
export class SalesModule {}
