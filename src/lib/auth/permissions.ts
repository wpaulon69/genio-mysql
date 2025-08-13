import { User } from '@/lib/types/auth';

// Definición de permisos disponibles
export const PERMISSIONS = {
  // Gestión de usuarios
  MANAGE_USERS: 'MANAGE_USERS',
  
  // Gestión de servicios
  MANAGE_ALL_SERVICES: 'MANAGE_ALL_SERVICES',
  MANAGE_OWN_SERVICE: 'MANAGE_OWN_SERVICE',
  VIEW_ALL_SERVICES: 'VIEW_ALL_SERVICES',
  VIEW_OWN_SERVICE: 'VIEW_OWN_SERVICE',
  
  // Gestión de empleados
  MANAGE_ALL_EMPLOYEES: 'MANAGE_ALL_EMPLOYEES',
  MANAGE_SERVICE_EMPLOYEES: 'MANAGE_SERVICE_EMPLOYEES',
  VIEW_ALL_EMPLOYEES: 'VIEW_ALL_EMPLOYEES',
  VIEW_SERVICE_EMPLOYEES: 'VIEW_SERVICE_EMPLOYEES',
  
  // Gestión de horarios
  MANAGE_ALL_SCHEDULES: 'MANAGE_ALL_SCHEDULES',
  MANAGE_SERVICE_SCHEDULES: 'MANAGE_SERVICE_SCHEDULES',
  VIEW_SERVICE_SCHEDULES: 'VIEW_SERVICE_SCHEDULES',
  
  // Informes
  VIEW_ALL_REPORTS: 'VIEW_ALL_REPORTS',
  VIEW_SERVICE_REPORTS: 'VIEW_SERVICE_REPORTS',
  
  // Sistema
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  MANAGE_HOLIDAYS: 'MANAGE_HOLIDAYS',
  APPROVE_SHIFT_CHANGES: 'APPROVE_SHIFT_CHANGES',
  
  // Perfil personal
  VIEW_OWN_PROFILE: 'VIEW_OWN_PROFILE'
} as const;

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
  supervisor: [
    PERMISSIONS.VIEW_SERVICE_EMPLOYEES,
    PERMISSIONS.VIEW_SERVICE_SCHEDULES,
    PERMISSIONS.VIEW_OWN_SERVICE,
    PERMISSIONS.VIEW_OWN_PROFILE
  ],
  empleado: [
    PERMISSIONS.VIEW_OWN_PROFILE
  ]
} as const;

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(user: User, permission: string): boolean {
  if (!user?.role?.name) return false;
  
  // SIEMPRE usar el mapeo hardcodeado para garantizar funcionamiento
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
 * Verifica si un usuario puede gestionar empleados (admin hospital o jefe servicio)
 */
export function canManageEmployees(user: User): boolean {
  return hasAnyPermission(user, [
    PERMISSIONS.MANAGE_ALL_EMPLOYEES,    // Admin Hospital
    PERMISSIONS.MANAGE_SERVICE_EMPLOYEES // Jefe Servicio
  ]);
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