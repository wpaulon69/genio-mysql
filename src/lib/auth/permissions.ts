import { User } from '@/lib/types/auth';

// Mapeo de permisos por rol (actualizado con la base de datos)
const ROLE_PERMISSIONS = {
  super_admin: [
    'MANAGE_USERS',
    'MANAGE_ALL_SERVICES', 
    'MANAGE_ALL_EMPLOYEES',
    'MANAGE_ALL_SCHEDULES',
    'VIEW_ALL_REPORTS',
    'SYSTEM_SETTINGS',
    'MANAGE_HOLIDAYS',
    'APPROVE_SHIFT_CHANGES',
    'VIEW_ALL_SERVICES',
    'VIEW_ALL_EMPLOYEES'
  ],
  admin_hospital: [
    'MANAGE_USERS',
    'MANAGE_ALL_SERVICES',
    'MANAGE_ALL_EMPLOYEES', 
    'VIEW_ALL_SERVICES',
    'VIEW_ALL_EMPLOYEES',
    'VIEW_ALL_REPORTS',
    'MANAGE_HOLIDAYS',
    'APPROVE_SHIFT_CHANGES'
  ],
  jefe_servicio: [
    'MANAGE_SERVICE_EMPLOYEES',
    'MANAGE_SERVICE_SCHEDULES',
    'VIEW_SERVICE_EMPLOYEES', 
    'VIEW_SERVICE_SCHEDULES',
    'MANAGE_OWN_SERVICE',
    'VIEW_OWN_SERVICE',
    'VIEW_SERVICE_REPORTS',
    'APPROVE_SHIFT_CHANGES',
    'VIEW_OWN_PROFILE'
  ],
  supervisor: [
    'VIEW_SERVICE_EMPLOYEES',
    'VIEW_SERVICE_SCHEDULES',
    'VIEW_OWN_SERVICE',
    'VIEW_OWN_PROFILE'
  ],
  empleado: [
    'VIEW_OWN_PROFILE'
  ]
};

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(user: User, permission: string): boolean {
  if (!user?.role?.name) return false;
  
  const rolePermissions = ROLE_PERMISSIONS[user.role.name as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission) || false;
}

/**
 * Verifica si un usuario tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(user: User, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Verifica si un usuario tiene todos los permisos especificados
 */
export function hasAllPermissions(user: User, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Obtiene todos los permisos de un usuario
 */
export function getUserPermissions(user: User): string[] {
  if (!user?.role?.name) return [];
  
  return ROLE_PERMISSIONS[user.role.name as keyof typeof ROLE_PERMISSIONS] || [];
}

/**
 * Verifica si un usuario puede gestionar otro usuario basado en niveles de rol
 */
export function canManageUser(currentUser: User, targetUser: User): boolean {
  if (!hasPermission(currentUser, 'MANAGE_USERS')) return false;
  
  // Super admin puede gestionar a todos
  if (currentUser.role.name === 'super_admin') return true;
  
  // Admin hospital puede gestionar a todos excepto super admin
  if (currentUser.role.name === 'admin_hospital') {
    return targetUser.role.name !== 'super_admin';
  }
  
  return false;
}