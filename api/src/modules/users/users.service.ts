import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateUserDto } from './users.dto';
import bcrypt from 'bcryptjs';
@Injectable() export class UsersService { constructor(private readonly prisma: PrismaService) {}
  list(tenantId: string) { return this.prisma.user.findMany({ where: { tenantId }, select: { id: true, firstName: true, lastName: true, email: true, role: true, pharmacyId: true, active: true, createdAt: true }, orderBy: { createdAt: 'asc' } }); }
  async create(tenantId: string, role: string, dto: CreateUserDto, pharmacyId?: string | null) { if (role !== 'OWNER') throw new ForbiddenException('Seul un OWNER peut inviter un utilisateur'); const passwordHash = await bcrypt.hash(dto.password, 12); return this.prisma.user.create({ data: { tenantId, pharmacyId: pharmacyId ?? null, firstName: dto.firstName, lastName: dto.lastName, email: dto.email.toLowerCase(), passwordHash, role: dto.role, mustChangePassword: true }, select: { id: true, firstName: true, lastName: true, email: true, role: true, active: true, mustChangePassword: true } }); }
}
