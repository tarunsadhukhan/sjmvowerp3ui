// middleware.ts (Next.js Middleware for Tenant Resolution - Split Projects with Cookie-based Subdomain Persistence)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboardctrldesk', '/dashboardadmin', '/dashboardportal'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const accessToken = request.cookies.get('access_token'); // Ensure this is correctly retrieved
  console.log(request.cookies)
  console.log('Hostyyyyname:', hostname); // Debugging hostname
  console.log('Access Token:', accessToken); // Debugging access token

  // Extract subdomain from hostname (support for localhost and production)
  const subdomain = hostname.includes('.localhost:3000')
    ? hostname.split('.localhost:3000')[0]
    : hostname.split('.')[0];

  console.log('Subdomain:', subdomain); // Debugging subdomain

  // Validate subdomain via static list (simulate API validation)
  const staticSubdomains = ['admin', 'sls', 'abc'];
  const validateRes = { ok: staticSubdomains.includes(subdomain) };

  if (!validateRes.ok) {
    console.log('Invalid subdomain. Redirecting to main site.');
    return NextResponse.redirect(new URL('https://vowerp.com', request.url));
  }

  // If hitting root, rewrite and set subdomain in cookie
  if (url.pathname === '/') {
    const response = NextResponse.rewrite(new URL(url.pathname, request.url));
    response.cookies.set('subdomain', subdomain, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });
    return response;
  }

  // Authorization check for protected routes
  if (PROTECTED_PATHS.includes(url.pathname)) {
    if (!accessToken) {
      console.log('Access token missing. Redirecting to login.');
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.set('subdomain', subdomain, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      });
      return response;
    }
  }

  // Always set the subdomain cookie for other valid routes
  const response = NextResponse.next();
  response.cookies.set('subdomain', subdomain, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/',
  });
  return response;
}

export const config = {
  matcher: ['/:path*'],
};
