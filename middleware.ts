import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('gate')?.value;

  if (!token) {
    return NextResponse.redirect('https://drakarinapesce.com.ar/mis-cursos/', { status: 302 });
  }

  const secret = process.env.GATE_SECRET;

  if (!secret) {
    return NextResponse.redirect('https://drakarinapesce.com.ar/mis-cursos/', { status: 302 });
  }

  try {
    jwt.verify(token, secret);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect('https://drakarinapesce.com.ar/mis-cursos/', { status: 302 });
  }
}

export const config = {
  matcher: '/:path*'
};

