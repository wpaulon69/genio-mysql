import { getConnection } from './config';
import { hash } from 'bcryptjs';
import type { User, UserRole, Permission } from '@/lib/types/auth';

export async function getUserByEmail(email: string): Promise<User | null> {
  const connection = await getConnection();
  try {
    const result = await connection.execute(`
      SELECT 
        u.*,
        ur.name as role_name,
        ur.display_name as role_display_name,
        ur.level as role_level,
        GROUP_CONCAT(p.id) as permissions
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.email = ? AND u.is_active = TRUE
      GROUP BY u.id
    `, [email]);

    const users = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
    
    if (users.length === 0) {
      return null;
    }

    const userData = users[0];
    const permissions = userData.permissions ? userData.permissions.split(',').map(p => p.trim()) : [];

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      hashedPassword: userData.hashed_password,
      role: {
        id: userData.role_id,
        name: userData.role_name,
        displayName: userData.role_display_name,
        level: userData.role_level,
        permissions: permissions
      },
      serviceId: userData.service_id,
      employeeId: userData.employee_id,
      permissions: permissions,
      isActive: userData.is_active,
      lastLogin: userData.last_login,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  } finally {
    connection.release();
  }
}

export async function getUserById(id: string): Promise<User | null> {
  const connection = await getConnection();
  try {
    const result = await connection.execute(`
      SELECT 
        u.*,
        ur.name as role_name,
        ur.display_name as role_display_name,
        ur.level as role_level,
        GROUP_CONCAT(p.id) as permissions
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND u.is_active = TRUE
      GROUP BY u.id
    `, [id]);

    const users = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
    
    if (users.length === 0) {
      return null;
    }

    const userData = users[0];
    const permissions = userData.permissions ? userData.permissions.split(',').map(p => p.trim()) : [];

    return {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      hashedPassword: userData.hashed_password,
      role: {
        id: userData.role_id,
        name: userData.role_name,
        displayName: userData.role_display_name,
        level: userData.role_level,
        permissions: permissions
      },
      serviceId: userData.service_id,
      employeeId: userData.employee_id,
      permissions: permissions,
      isActive: userData.is_active,
      lastLogin: userData.last_login,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    };
  } finally {
    connection.release();
  }
}

export async function createUser(userData: {
  email: string;
  name: string;
  password: string;
  roleId: string;
  serviceId?: number;
  employeeId?: number;
  isActive?: boolean;
  mustChangePassword?: boolean;
}): Promise<string> {
  const connection = await getConnection();
  try {
    const hashedPassword = await hash(userData.password, 12);
    
    // Generar UUID manualmente para MySQL 5
    const userId = generateUUID();
    
    const result = await connection.execute(`
      INSERT INTO users (id, email, name, hashed_password, role_id, service_id, employee_id, is_active, must_change_password, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      userId,
      userData.email,
      userData.name,
      hashedPassword,
      userData.roleId,
      userData.serviceId || null,
      userData.employeeId || null,
      userData.isActive ?? true ? 1 : 0,
      userData.mustChangePassword ?? true ? 1 : 0
    ]);

    return userId;
  } finally {
    connection.release();
  }
}

// Función para generar UUID compatible con MySQL 5
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function updateLastLogin(userId: string): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [userId]);
  } finally {
    connection.release();
  }
}

export async function updateUserPassword(userId: string, newPassword: string): Promise<void> {
  const connection = await getConnection();
  try {
    const hashedPassword = await hash(newPassword, 12);
    
    await connection.execute(`
      UPDATE users 
      SET hashed_password = ?, must_change_password = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [hashedPassword, userId]);
  } finally {
    connection.release();
  }
}

export async function getAllUsers(): Promise<User[]> {
  const connection = await getConnection();
  try {
    const result = await connection.execute(`
      SELECT 
        u.*,
        ur.name as role_name,
        ur.display_name as role_display_name,
        ur.level as role_level,
        s.nombre_servicio as service_name,
        e.nombre as employee_name
      FROM users u
      JOIN user_roles ur ON u.role_id = ur.id
      LEFT JOIN servicios s ON u.service_id = s.id_servicio
      LEFT JOIN empleados e ON u.employee_id = e.id_empleado
      ORDER BY ur.level ASC, u.name ASC
    `);

    const users = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
    
    return users.map(userData => ({
      id: userData.id,
      email: userData.email,
      name: userData.name,
      hashedPassword: userData.hashed_password,
      role: {
        id: userData.role_id,
        name: userData.role_name,
        displayName: userData.role_display_name,
        level: userData.role_level,
        permissions: []
      },
      serviceId: userData.service_id,
      employeeId: userData.employee_id,
      permissions: [],
      isActive: userData.is_active,
      lastLogin: userData.last_login,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at
    }));
  } finally {
    connection.release();
  }
}

export async function getUserRoles(): Promise<UserRole[]> {
  const connection = await getConnection();
  try {
    const result = await connection.execute(`
      SELECT ur.*, GROUP_CONCAT(p.name) as permissions
      FROM user_roles ur
      LEFT JOIN role_permissions rp ON ur.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY ur.id
      ORDER BY ur.level ASC
    `);

    const roles = result && Array.isArray(result) && result[0] ? result[0] as any[] : [];
    
    return roles.map(roleData => ({
      id: roleData.id,
      name: roleData.name,
      displayName: roleData.display_name,
      level: roleData.level,
      permissions: roleData.permissions ? roleData.permissions.split(',') : []
    }));
  } finally {
    connection.release();
  }
}

export async function deactivateUser(userId: string): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(`
      UPDATE users 
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId]);
  } finally {
    connection.release();
  }
}

export async function activateUser(userId: string): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(`
      UPDATE users 
      SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [userId]);
  } finally {
    connection.release();
  }
}

export async function updateUser(userId: string, userData: {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  serviceId?: number;
  employeeId?: number;
  isActive?: boolean;
  mustChangePassword?: boolean;
}): Promise<void> {
  const connection = await getConnection();
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (userData.name) {
      updates.push('name = ?');
      values.push(userData.name);
    }
    if (userData.email) {
      updates.push('email = ?');
      values.push(userData.email);
    }
    if (userData.password) {
      const hashedPassword = await hash(userData.password, 12);
      updates.push('hashed_password = ?');
      values.push(hashedPassword);
    }
    if (userData.roleId) {
      updates.push('role_id = ?');
      values.push(userData.roleId);
    }
    if (userData.serviceId !== undefined) {
      updates.push('service_id = ?');
      values.push(userData.serviceId || null);
    }
    if (userData.employeeId !== undefined) {
      updates.push('employee_id = ?');
      values.push(userData.employeeId || null);
    }
    if (userData.isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(userData.isActive ? 1 : 0);
    }
    if (userData.mustChangePassword !== undefined) {
      updates.push('must_change_password = ?');
      values.push(userData.mustChangePassword ? 1 : 0);
    }

    updates.push('updated_at = NOW()');
    values.push(userId);

    await connection.execute(`
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = ?
    `, values);
  } finally {
    connection.release();
  }
}

export async function deleteUser(userId: string): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(`
      DELETE FROM users WHERE id = ?
    `, [userId]);
  } finally {
    connection.release();
  }
}