import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { PermissionType } from '@/lib/auth/permissions';
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
export function usePermission(permission?: PermissionType) {
  const { user } = useAuth();
  
  if (!permission) return true;
  if (!user) return false;
  
  return hasPermission(user, permission);
}

/**
 * Hook para verificar si el usuario tiene un rol específico o superior
 */
export function useRole(minRole?: 'super_admin' | 'admin_hospital' | 'jefe_servicio' | 'empleado') {
  const { user } = useAuth();
  
  if (!minRole) return true;
  if (!user) return false;
  
  const roleHierarchy = {
    'super_admin': 1,
    'admin_hospital': 2,
    'jefe_servicio': 3,
    'empleado': 5
  };
  
  return roleHierarchy[user.role.name] <= roleHierarchy[minRole];
}

// ... (rest of the file is unchanged)
