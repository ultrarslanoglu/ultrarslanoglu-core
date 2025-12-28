import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Korumalı route'lar
const protectedPaths = ['/dashboard', '/admin', '/upload', '/analytics'];
const adminPaths = ['/admin'];
const editorPaths = ['/upload'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth sayfalarına zaten giriş yapmış kullanıcı erişmesin
  if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register')) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Korumalı sayfalara erişim kontrolü
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  
  if (isProtectedPath) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });

    if (!token) {
      const url = new URL('/auth/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Admin sayfaları kontrolü
    const isAdminPath = adminPaths.some(path => pathname.startsWith(path));
    if (isAdminPath && token.role !== 'admin' && token.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }

    // Editor sayfaları kontrolü
    const isEditorPath = editorPaths.some(path => pathname.startsWith(path));
    if (isEditorPath && 
        token.role !== 'editor' && 
        token.role !== 'admin' && 
        token.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/dashboard?error=unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/upload/:path*',
    '/analytics/:path*',
    '/auth/login',
    '/auth/register'
  ]
};
