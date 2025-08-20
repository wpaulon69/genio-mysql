import { Session } from 'next-auth';
import { User } from '@/lib/types'; // Corrected import path
import { PERMISSIONS } from './permission-constants';
export { PERMISSIONS } from './permission-constants';

// Definición de permisos disponibles


export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Mapeo de permisos por rol
export const ROLE_PERMISSIONS = {
  super_admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_SERVICES,
    PERMISSIONS.MANAGE_ALL_EMPLOYEES,
    PERMISSIONS.MANAGE_ALL_SCHEDULES,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_HOLIDAYS,
    PERMISSIONS.APPROVE_SHIFT_CHANGES,
    PERMISSIONS.VIEW_ALL_SERVICES,
    PERMISSIONS.VIEW_ALL_EMPLOYEES
  ],
  admin_hospital: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_SERVICES,
    PERMISSIONS.MANAGE_ALL_EMPLOYEES,
    PERMISSIONS.VIEW_ALL_SERVICES,
    PERMISSIONS.VIEW_ALL_EMPLOYEES,
    PERMISSIONS.VIEW_ALL_REPORTS,
    PERMISSIONS.MANAGE_HOLIDAYS,
    PERMISSIONS.APPROVE_SHIFT_CHANGES,
    PERMISSIONS.VIEW_SERVICE_SCHEDULES,
    PERMISSIONS.VIEW_OWN_PROFILE
  ],
  jefe_servicio: [
    PERMISSIONS.MANAGE_SERVICE_EMPLOYEES,
    PERMISSIONS.MANAGE_SERVICE_SCHEDULES,
    PERMISSIONS.VIEW_SERVICE_EMPLOYEES,
    PERMISSIONS.VIEW_SERVICE_SCHEDULES,
    PERMISSIONS.MANAGE_OWN_SERVICE,
    PERMISSIONS.VIEW_OWN_SERVICE,
    PERMISSIONS.VIEW_SERVICE_REPORTS,
    PERMISSIONS.APPROVE_SHIFT_CHANGES,
    PERMISSIONS.VIEW_OWN_PROFILE
  ],
  
  empleado: [
    PERMISSIONS.VIEW_OWN_PROFILE
  ]
} as const;

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(user: Session['user'], permission: PermissionType): boolean {
  if (!user?.role?.name) return false;
  
  const rolePermissions: ReadonlyArray<PermissionType> = ROLE_PERMISSIONS[user.role.name as keyof typeof ROLE_PERMISSIONS];
  return rolePermissions?.includes(permission) || false;
}

/**
 * Verifica si un usuario tiene al menos uno de los permisos especificados
 */
export function hasAnyPermission(user: Session['user'], permissions: ReadonlyArray<PermissionType>): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Verifica si un usuario puede gestionar empleados (admin hospital o jefe servicio)
 */
export function canManageEmployees(user: Session['user']): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.MANAGE_ALL_EMPLOYEES,    // Admin Hospital
    PERMISSIONS.MANAGE_SERVICE_EMPLOYEES // Jefe Servicio
  ]);
}

/**
 * Verifica si un usuario tiene todos los permisos especificados
 */
export function hasAllPermissions(user: Session['user'], permissions: ReadonlyArray<PermissionType>): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Obtiene todos los permisos de un usuario
 */
export function getUserPermissions(user: Session['user']): ReadonlyArray<PermissionType> {
  if (!user?.role?.name) return [];
  
  return ROLE_PERMISSIONS[user.role.name as keyof typeof ROLE_PERMISSIONS] || [];
}

/**
 * Verifica si un usuario puede gestionar otro usuario basado en niveles de rol
 */
export function canManageUser(currentUser: Session['user'], targetUser: User): boolean {
  if (!hasPermission(currentUser, 'MANAGE_USERS')) return false;
  
  // Super admin puede gestionar a todos
  if (currentUser.role.name === 'super_admin') return true;
  
  // Admin hospital puede gestionar a todos excepto super admin
  if (currentUser.role.name === 'admin_hospital') {
    return targetUser.role.name !== 'super_admin';
  }
  
  return false;
}