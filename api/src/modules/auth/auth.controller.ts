import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './auth.dto';
import { AuthGuard } from './auth.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @UseGuards(AuthGuard) @Get('me') me(@Req() req: Request) { return this.auth.me((req as any).user.sub); }
  @UseGuards(AuthGuard) @Post('change-password') changePassword(@Req() req: Request, @Body() body: unknown) { return this.auth.changePassword((req as any).user.sub, ChangePasswordDto.validate(body)); }
  private setCookies(res: Response, result: { accessToken: string; refreshToken: string }) { res.cookie('accessToken', result.accessToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }); res.cookie('refreshToken', result.refreshToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/auth' }); }
  @Post('register') async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) { const result = await this.auth.register(dto); this.setCookies(res, result); return result.user; }
  @Post('login') async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) { const result = await this.auth.login(dto); this.setCookies(res, result); return result.user; }
  @Post('refresh') async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) { const result = await this.auth.refresh(req.cookies?.refreshToken); this.setCookies(res, result); return { ok: true }; }
  @UseGuards(AuthGuard) @Post('logout') async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { await this.auth.logout((req as any).user.sub); res.clearCookie('accessToken'); res.clearCookie('refreshToken', { path: '/auth' }); return { ok: true }; }
}
