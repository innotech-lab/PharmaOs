import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { AuthGuard } from '../auth/auth.guard';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
@Module({ imports: [JwtModule.register({})], controllers: [UsersController], providers: [UsersService, PrismaService, AuthGuard] })
export class UsersModule {}
