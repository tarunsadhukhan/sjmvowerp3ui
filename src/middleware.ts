// middleware.ts (Edge Middleware for Tenant + Auth Validation)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// Ensure this has full absolute URLs, not relative
import {apiRoutes} from './utils/api'; // Ensure this has full absolute URLs, not relative
import { determinePortalAction } from './utils/portalPermissions';


const PROTECTED_PATHS = ['/dashboardctrldesk', '/dashboardadmin', '/dashboardportal'];
const PUBLIC_PATHS = ['/', '/login', '/_next', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const accessToken = request.cookies.get('access_token');
  const permissionToken = request.cookies.get('portal_permission_token');
  const pathname = url.pathname;

  console.log('🔍 Middleware - Host:', hostname);
  console.log('🔍 Middleware - Access Token:', accessToken?.value);

  // Extract subdomain from hostname
  const subdomain = hostname.includes('.localhost:3000')
    ? hostname.split('.localhost:3000')[0]
    : hostname.split('.')[0];

  // Simulate subdomain validation
  const staticSubdomains = ['admin', 'sls', 'abc'];
  const isSubdomainValid = staticSubdomains.includes(subdomain);

  if (!isSubdomainValid) {
    console.log('❌ Invalid subdomain, redirecting...');
    return NextResponse.redirect(new URL('https://vowerp.com', request.url));
  }

  // Skip middleware for public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    console.log('🟢 Public path, skipping auth:', pathname);
    return NextResponse.next();
  }

  // Handle protected paths
  if (PROTECTED_PATHS.some(path => pathname.startsWith(path))) {
    if (!accessToken?.value) {
      console.log('⛔ No access token, redirecting to login');
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const cookieHeader = [
      accessToken?.value ? `access_token=${accessToken.value}` : null,
      permissionToken?.value ? `portal_permission_token=${permissionToken.value}` : null,
    ].filter(Boolean).join('; ');

    try {
      // Edge-compatible fetch, manually forwarding cookie
      const verifyRes = await fetch(apiRoutes.VERIFYSESSION, {
        method: 'GET',
        headers: {
          ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
        },
      });

      if (!verifyRes.ok) {
        console.log('⚠️ Token verification failed (status)', verifyRes.status);
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const data = await verifyRes.json();
      if (!data.ok) {
        console.log('⚠️ Token invalid per backend');
        return NextResponse.redirect(new URL('/login', request.url));
      }

      console.log('✅ Session verified');
    } catch (err) {
      console.error('❌ Error during token check:', err);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/dashboardportal')) {
      try {
  const action = determinePortalAction(pathname);
        const permissionRes = await fetch(apiRoutes.PORTAL_MENU_PERMISSION_CHECK, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
          },
          body: JSON.stringify({ path: pathname, action }),
        });

        if (permissionRes.status === 401 || permissionRes.status === 403) {
          console.warn('⚠️ Permission token missing or invalid');
          return NextResponse.redirect(new URL('/login', request.url));
        }

        if (!permissionRes.ok) {
          console.warn('⚠️ Permission check failed (status)', permissionRes.status);
          return NextResponse.redirect(new URL('/dashboardportal', request.url));
        }

        const permissionPayload = await permissionRes.json();
        if (!permissionPayload?.allowed) {
          console.warn('⛔ Access denied for path', pathname, 'required action', action);
          return NextResponse.redirect(new URL('/dashboardportal', request.url));
        }
      } catch (err) {
        console.error('❌ Error during permission check:', err);
        return NextResponse.redirect(new URL('/dashboardportal', request.url));
      }
    }
  }

  // Optional: persist subdomain as cookie
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
