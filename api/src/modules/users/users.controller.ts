import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto } from './users.dto';
import { UsersService } from './users.service';
@UseGuards(AuthGuard) @Controller('users') export class UsersController { constructor(private readonly users: UsersService) {} @Get() list(@Req() req: any) { return this.users.list(req.user.tenantId); } @Post() create(@Req() req: any, @Body() dto: CreateUserDto) { return this.users.create(req.user.tenantId, req.user.role, dto, req.user.pharmacyId); } }
