import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
export function middleware(request: NextRequest) { const hasSession = request.cookies.has('accessToken'); const isAuth = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register'; if (!hasSession && !isAuth) return NextResponse.redirect(new URL('/login', request.url)); if (hasSession && isAuth) return NextResponse.redirect(new URL('/', request.url)); return NextResponse.next(); }
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
