import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');

    // Si está en página de auth y ya está autenticado, redirigir al dashboard
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Si no está autenticado y no está en página de auth, redirigir al login
    if (!isAuthPage && !isAuth) {
      let from = req.nextUrl.pathname;
      if (req.nextUrl.search) {
        from += req.nextUrl.search;
      }

      return NextResponse.redirect(
        new URL(`/auth/signin?callbackUrl=${encodeURIComponent(from)}`, req.url)
      );
    }

    // Verificar permisos específicos por ruta
    if (isAuth && token) {
      const userRole = token.role as any;
      const userPermissions = token.permissions as string[];
      const pathname = req.nextUrl.pathname;

      // Rutas que requieren permisos específicos
      const routePermissions: Record<string, string> = {
        '/services': 'view_all_services',
        '/employees': 'view_all_employees',
        '/schedule': 'view_all_schedules',
        '/reports': 'view_all_reports',
        '/holidays': 'manage_holidays'
      };

      // Verificar si la ruta requiere un permiso específico
      const requiredPermission = routePermissions[pathname];
      
      if (requiredPermission) {
        // Super admin tiene todos los permisos
        if (userRole?.name !== 'super_admin' && !userPermissions?.includes(requiredPermission)) {
          return NextResponse.redirect(new URL('/unauthorized', req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Esta función determina si el middleware debe ejecutarse
        // Retornamos true para que siempre se ejecute y manejemos la lógica arriba
        return true;
      }
    }
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'
  ]
};