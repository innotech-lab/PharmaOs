import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { createUserSchema, updateUserSchema } from '@pharmaos/shared';
import { AuthGuard } from '../auth/auth.guard';
import { CreateUserDto, UpdateUserDto } from './users.dto';
import { UsersService } from './users.service';
import { ZodValidationPipe } from '../../shared/zod-validation.pipe';
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() list(@Req() req: any) { return this.users.list(req.user.tenantId); }
  @Post() create(@Req() req: any, @Body(new ZodValidationPipe(createUserSchema)) dto: CreateUserDto) { return this.users.create(req.user.tenantId, req.user.role, dto); }
  @Patch(':id') update(@Req() req: any, @Param('id') id: string, @Body(new ZodValidationPipe(updateUserSchema)) dto: UpdateUserDto) { return this.users.update(req.user.tenantId, req.user.role, id, dto); }
  @Delete(':id') remove(@Req() req: any, @Param('id') id: string) { return this.users.remove(req.user.tenantId, req.user.role, id, req.user.sub); }
}
