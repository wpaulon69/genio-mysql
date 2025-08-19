import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { PermissionType } from '@/lib/types/auth';
import { hasPermission } from '@/lib/auth/permissions';

/**
 * Hook para obtener la sesión del usuario autenticado
 */
export function useAuth() {
  const { data: session, status } = useSession();
  
  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    session
  };
}

/**
 * Hook para verificar si el usuario tiene un permiso específico
 */
export function usePermission(permission: PermissionType) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  return hasPermission(user, permission);
}

/**
 * Hook para verificar múltiples permisos
 */
export function usePermissions(permissions: PermissionType[], requireAll = false) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  if (requireAll) {
    return permissions.every(permission => hasPermission(user, permission));
  } else {
    return permissions.some(permission => hasPermission(user, permission));
  }
}

/**
 * Hook para verificar si el usuario tiene un rol específico o superior
 */
export function useRole(minRole: 'super_admin' | 'admin_hospital' | 'jefe_servicio' | 'empleado') {
  const { user } = useAuth();
  
  if (!user) return false;
  
  const roleHierarchy = {
    'super_admin': 1,
    'admin_hospital': 2,
    'jefe_servicio': 3,
    'empleado': 5
  };
  
  return user.role.level <= roleHierarchy[minRole];
}

/**
 * Hook para proteger rutas que requieren autenticación
 */
export function useRequireAuth(redirectTo = '/auth/signin') {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);
  
  return { isAuthenticated, isLoading };
}

/**
 * Hook para proteger rutas que requieren permisos específicos
 */
export function useRequirePermission(
  permission: PermissionType, 
  redirectTo = '/unauthorized'
) {
  const { isAuthenticated, isLoading } = useAuth();
  const hasPermission = usePermission(permission);
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasPermission) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, hasPermission, router, redirectTo]);
  
  return { hasPermission, isLoading };
}

/**
 * Hook para verificar si el usuario puede acceder a un servicio específico
 */
export function useServiceAccess(serviceId: number) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  // Super admin y admin hospital pueden acceder a todos los servicios
  if (user.role.name === 'super_admin' || user.role.name === 'admin_hospital') {
    return true;
  }
  
  // Otros roles solo pueden acceder a su servicio asignado
  return user.serviceId === serviceId;
}

/**
 * Hook para verificar si el usuario puede acceder a datos de un empleado específico
 */
export function useEmployeeAccess(employeeId: number) {
  const { user } = useAuth();
  
  if (!user) return false;
  
  // Super admin y admin hospital pueden acceder a todos los empleados
  if (user.role.name === 'super_admin' || user.role.name === 'admin_hospital') {
    return true;
  }
  
  // Empleado solo puede acceder a sus propios datos
  if (user.role.name === 'empleado') {
    return user.employeeId === employeeId;
  }
  
  // Jefe de servicio puede acceder a empleados de su servicio
  // Esto requeriría una consulta adicional para verificar el servicio del empleado
  return true; // Simplificado por ahora
}