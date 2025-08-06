import { getConnection } from './config';
import type { Holiday } from '@/lib/types';

export async function getHolidays(): Promise<Holiday[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute('SELECT id, DATE_FORMAT(date, "%Y-%m-%d") as date, name FROM holidays');
    return rows as Holiday[];
  } finally {
    connection.release();
  }
}

export async function createHoliday(holiday: Omit<Holiday, 'id'>): Promise<number> {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute(
      'INSERT INTO holidays (date, name) VALUES (?, ?)',
      [holiday.date, holiday.name]
    );
    return (result as any).insertId;
  } finally {
    connection.release();
  }
}

export async function updateHoliday(id: number, holiday: Omit<Holiday, 'id'>): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute(
      'UPDATE holidays SET date = ?, name = ? WHERE id = ?',
      [holiday.date, holiday.name, id]
    );
  } finally {
    connection.release();
  }
}

export async function deleteHoliday(id: number): Promise<void> {
  const connection = await getConnection();
  try {
    await connection.execute('DELETE FROM holidays WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
}
