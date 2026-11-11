import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';
import bcrypt from 'bcryptjs';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async me(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id, active: true }, select: { id: true, tenantId: true, pharmacyId: true, role: true, email: true, firstName: true, lastName: true, pharmacy: { select: { id: true, name: true, city: true, country: true } } } });
    if (!user) throw new UnauthorizedException('Compte introuvable ou désactivé');
    return user;
  }
  private tokens(user: { id: string; tenantId: string; pharmacyId: string | null; role: any; email: string }) { const payload = { sub: user.id, tenantId: user.tenantId, pharmacyId: user.pharmacyId, role: user.role, email: user.email }; const accessOptions: any = { secret: process.env.JWT_SECRET ?? 'dev-only-change-me', expiresIn: process.env.JWT_EXPIRES_IN ?? '1d' }; const refreshOptions: any = { secret: process.env.REFRESH_TOKEN_SECRET ?? 'dev-only-refresh-change-me', expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d' }; return { accessToken: this.jwt.sign(payload, accessOptions), refreshToken: this.jwt.sign({ sub: user.id, tenantId: user.tenantId }, refreshOptions) }; }
  async register(dto: RegisterDto) { const email = dto.email.toLowerCase(); const exists = await this.prisma.user.findFirst({ where: { email } }); if (exists) throw new ConflictException('Cette adresse e-mail est déjà utilisée'); const passwordHash = await bcrypt.hash(dto.password, 12); const user = await this.prisma.$transaction(async tx => { const tenant = await tx.tenant.create({ data: { name: dto.pharmacy } }); const pharmacy = await tx.pharmacy.create({ data: { tenantId: tenant.id, name: dto.pharmacy, country: dto.country, city: dto.city } }); return tx.user.create({ data: { tenantId: tenant.id, pharmacyId: pharmacy.id, firstName: dto.firstName, lastName: dto.lastName, email, passwordHash, role: 'OWNER' }, select: { id: true, tenantId: true, pharmacyId: true, role: true, email: true, firstName: true, lastName: true } }); }); return { user, ...this.tokens(user) }; }
  async login(dto: LoginDto) { const user = await this.prisma.user.findFirst({ where: { email: dto.email.toLowerCase(), active: true } }); if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('E-mail ou mot de passe incorrect'); const tokens = this.tokens(user); await this.prisma.user.update({ where: { id: user.id }, data: { refreshHash: await bcrypt.hash(tokens.refreshToken, 10) } }); return { user: { id: user.id, tenantId: user.tenantId, pharmacyId: user.pharmacyId, role: user.role, email: user.email, firstName: user.firstName, lastName: user.lastName }, ...tokens }; }
  async refresh(token?: string) { try { if (!token) throw new UnauthorizedException(); const payload = this.jwt.verify<{ sub: string }>(token, { secret: process.env.REFRESH_TOKEN_SECRET ?? 'dev-only-refresh-change-me' }); const user = await this.prisma.user.findUnique({ where: { id: payload.sub } }); if (!user || !user.refreshHash || !(await bcrypt.compare(token, user.refreshHash))) throw new UnauthorizedException(); return this.tokens(user); } catch { throw new UnauthorizedException('Refresh token invalide'); } }
  async logout(id: string) { await this.prisma.user.update({ where: { id }, data: { refreshHash: null } }); }
}
