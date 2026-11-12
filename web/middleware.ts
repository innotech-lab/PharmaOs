import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) { const hasSession = request.cookies.has('accessToken'); const pathname = request.nextUrl.pathname; const isAuth = pathname === '/login' || pathname === '/register'; const isPasswordChange = pathname === '/change-password'; if (!hasSession && !isAuth) return NextResponse.redirect(new URL('/login', request.url)); if (hasSession && isAuth) return NextResponse.redirect(new URL('/', request.url)); if (!hasSession && isPasswordChange) return NextResponse.redirect(new URL('/login', request.url)); return NextResponse.next(); }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
