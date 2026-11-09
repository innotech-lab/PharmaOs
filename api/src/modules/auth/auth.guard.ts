import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.accessToken ?? request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!token) throw new UnauthorizedException('Authentification requise');
    try { request.user = this.jwt.verify(token, { secret: process.env.JWT_SECRET ?? 'dev-only-change-me' }); return true; }
    catch { throw new UnauthorizedException('Jeton invalide ou expiré'); }
  }
}
