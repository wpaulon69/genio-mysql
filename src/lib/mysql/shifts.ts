import { getConnection } from './config';
import type { AIShift } from '@/lib/types';

export async function getShifts(): Promise<AIShift[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM `horario_detalles`');
    return rows as AIShift[];
  } finally {
    await connection.end();
  }
}

export async function createShift(shift: Omit<AIShift, 'id'>) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO `horario_detalles` (employeeName, serviceName, date, startTime, endTime, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [shift.employeeName, shift.serviceName, shift.date, shift.startTime, shift.endTime, shift.notes]
    );
    return (result as any).insertId;
  } finally {
    await connection.end();
  }
}

export async function updateShift(id: number, shift: Omit<AIShift, 'id'>) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      'UPDATE `horario_detalles` SET employeeName = ?, serviceName = ?, date = ?, startTime = ?, endTime = ?, notes = ? WHERE id = ?',
      [shift.employeeName, shift.serviceName, shift.date, shift.startTime, shift.endTime, shift.notes, id]
    );
    return result;
  } finally {
    await connection.end();
  }
}

export async function deleteShift(id: number) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute('DELETE FROM `horario_detalles` WHERE id = ?', [id]);
    return result;
  } finally {
    await connection.end();
  }
}
