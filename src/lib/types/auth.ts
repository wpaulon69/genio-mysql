export interface User {
  id: string;
  email: string;
  name: string;
  hashedPassword: string;
  role: UserRole;
  serviceId?: number;
  employeeId?: number;
  permissions: string[];
  isActive: boolean;
  mustChangePassword?: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  name: 'super_admin' | 'admin_hospital' | 'jefe_servicio' | 'empleado';
  displayName: string;
  level: number;
  permissions: string[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    serviceId?: number;
    employeeId?: number;
    permissions: string[];
    mustChangePassword?: boolean;
  };
}

// Permisos específicos del sistema
export const PERMISSIONS = {
  // Gestión de servicios
  MANAGE_ALL_SERVICES: 'manage_all_services',
  MANAGE_OWN_SERVICE: 'manage_own_service',
  VIEW_ALL_SERVICES: 'view_all_services',
  VIEW_OWN_SERVICE: 'view_own_service',
  
  // Gestión de empleados
  MANAGE_ALL_EMPLOYEES: 'manage_all_employees',
  MANAGE_SERVICE_EMPLOYEES: 'manage_service_employees',
  VIEW_ALL_EMPLOYEES: 'view_all_employees',
  VIEW_SERVICE_EMPLOYEES: 'view_service_employees',
  VIEW_OWN_PROFILE: 'view_own_profile',
  
  // Gestión de horarios
  MANAGE_ALL_SCHEDULES: 'manage_all_schedules',
  MANAGE_SERVICE_SCHEDULES: 'manage_service_schedules',
  VIEW_ALL_SCHEDULES: 'view_all_schedules',
  VIEW_SERVICE_SCHEDULES: 'view_service_schedules',
  VIEW_OWN_SCHEDULE: 'view_own_schedule',
  
  // Intercambio de turnos
  APPROVE_SHIFT_CHANGES: 'approve_shift_changes',
  REQUEST_SHIFT_CHANGES: 'request_shift_changes',
  REQUEST_SHIFT_EXCHANGE: 'request_shift_exchange',
  
  // Reportes
  VIEW_ALL_REPORTS: 'view_all_reports',
  VIEW_SERVICE_REPORTS: 'view_service_reports',
  
  // Configuración
  MANAGE_HOLIDAYS: 'manage_holidays',
  MANAGE_USERS: 'manage_users',
  SYSTEM_SETTINGS: 'system_settings'
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Roles predefinidos con sus permisos
export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'super_admin' as const,
    displayName: 'Super Administrador',
    level: 1,
    permissions: Object.values(PERMISSIONS)
  },
  ADMIN_HOSPITAL: {
    id: 'admin_hospital',
    name: 'admin_hospital' as const,
    displayName: 'Administrador Hospital',
    level: 2,
    permissions: [
      PERMISSIONS.MANAGE_ALL_SERVICES,
      PERMISSIONS.MANAGE_ALL_EMPLOYEES,
      PERMISSIONS.MANAGE_ALL_SCHEDULES,
      PERMISSIONS.VIEW_ALL_SERVICES,
      PERMISSIONS.VIEW_ALL_EMPLOYEES,
      PERMISSIONS.VIEW_ALL_SCHEDULES,
      PERMISSIONS.APPROVE_SHIFT_CHANGES,
      PERMISSIONS.VIEW_ALL_REPORTS,
      PERMISSIONS.MANAGE_HOLIDAYS,
      PERMISSIONS.MANAGE_USERS
    ]
  },
  JEFE_SERVICIO: {
    id: 'jefe_servicio',
    name: 'jefe_servicio' as const,
    displayName: 'Jefe de Servicio',
    level: 3,
    permissions: [
      PERMISSIONS.MANAGE_OWN_SERVICE,
      PERMISSIONS.MANAGE_SERVICE_EMPLOYEES,
      PERMISSIONS.MANAGE_SERVICE_SCHEDULES,
      PERMISSIONS.VIEW_OWN_SERVICE,
      PERMISSIONS.VIEW_SERVICE_EMPLOYEES,
      PERMISSIONS.VIEW_SERVICE_SCHEDULES,
      PERMISSIONS.APPROVE_SHIFT_CHANGES,
      PERMISSIONS.VIEW_SERVICE_REPORTS,
      PERMISSIONS.VIEW_OWN_PROFILE
    ]
  },
  
  EMPLEADO: {
    id: 'empleado',
    name: 'empleado' as const,
    displayName: 'Empleado',
    level: 5,
    permissions: [
      PERMISSIONS.VIEW_OWN_SCHEDULE,
      PERMISSIONS.REQUEST_SHIFT_EXCHANGE,
      PERMISSIONS.VIEW_OWN_PROFILE
    ]
  }
} as const;