'use client';

import { useAuth, usePermission, useRole } from '@/lib/auth/hooks';
import { PermissionType } from '@/lib/types/auth';
import { Loader2, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: PermissionType;
  role?: 'super_admin' | 'admin_hospital' | 'jefe_servicio' | 'supervisor' | 'empleado';
  fallback?: React.ReactNode;
  showUnauthorized?: boolean;
}

/**
 * Componente para proteger rutas basado en permisos o roles
 */
export default function ProtectedRoute({
  children,
  permission,
  role,
  fallback,
  showUnauthorized = true
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const hasPermission = permission ? usePermission(permission) : true;
  const hasRole = role ? useRole(role) : true;

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir al login (esto debería manejarse en el layout)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Acceso Requerido</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Necesitas iniciar sesión para acceder a esta página.
            </p>
            <Button asChild>
              <Link href="/auth/signin">Iniciar Sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar permisos y roles
  const hasAccess = hasPermission && hasRole;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showUnauthorized) {
      return null;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-muted-foreground">
                No tienes permisos para acceder a esta sección.
              </p>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p><strong>Tu rol:</strong> {user?.role.displayName}</p>
                {permission && (
                  <p><strong>Permiso requerido:</strong> {permission}</p>
                )}
                {role && (
                  <p><strong>Rol mínimo requerido:</strong> {role}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col space-y-2">
              <Button asChild variant="outline">
                <Link href="/">Volver al Inicio</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Contacta a tu supervisor si necesitas acceso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Componente más simple para ocultar elementos basado en permisos
 */
interface PermissionGateProps {
  children: React.ReactNode;
  permission?: PermissionType;
  role?: 'super_admin' | 'admin_hospital' | 'jefe_servicio' | 'supervisor' | 'empleado';
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  role,
  fallback
}: PermissionGateProps) {
  const hasPermission = permission ? usePermission(permission) : true;
  const hasRole = role ? useRole(role) : true;
  const hasAccess = hasPermission && hasRole;

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}