import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const expectedUser = process.env.ADMIN_DASHBOARD_USER;
  const expectedPassword = process.env.ADMIN_DASHBOARD_PASSWORD;

  if (!expectedUser || !expectedPassword) {
    return new NextResponse('Administrator access is not configured.', { status: 503 });
  }

  const authorization = request.headers.get('authorization');
  if (authorization?.startsWith('Basic ')) {
    try {
      const decoded = atob(authorization.slice(6));
      const separator = decoded.indexOf(':');
      const user = decoded.slice(0, separator);
      const password = decoded.slice(separator + 1);
      if (separator > 0 && user === expectedUser && password === expectedPassword) {
        return NextResponse.next();
      }
    } catch {
      // The response below asks the browser for valid credentials.
    }
  }

  return new NextResponse('Administrator authorization is required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="UntangleAI review", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/admin/:path*'],
};
