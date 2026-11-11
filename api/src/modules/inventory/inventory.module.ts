import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [InventoryController],
  providers: [InventoryService, PrismaService, AuthGuard],
})
export class InventoryModule {}
