import { getConnection } from './config';
import type { TipoAsignacion } from '@/lib/types';

export async function getAssignmentTypes(): Promise<TipoAsignacion[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute('SELECT * FROM tipos_asignacion');
    return rows as TipoAsignacion[];
  } finally {
    await connection.end();
  }
}
