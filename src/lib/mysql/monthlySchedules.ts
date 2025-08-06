import { getConnection } from './config';
import type { MonthlySchedule, AIShift, ScheduleViolation, ScoreBreakdown } from '@/lib/types';

// Nota: Las funciones para obtener, crear, actualizar y eliminar horarios mensuales
// se vuelven más complejas debido a la estructura de tablas normalizada.
// Aquí se presenta una implementación simplificada. Una implementación completa
// requeriría un manejo más detallado de las relaciones.

export async function getMonthlySchedules(
  year?: string,
  month?: string,
  serviceId?: string,
  status?: string
): Promise<MonthlySchedule[]> {
    const connection = await getConnection();
    if (!connection) {
        throw new Error('Failed to get database connection from pool.');
    }
    try {
        let query = 'SELECT * FROM horarios';
        const params: (string | number)[] = [];

        if (year || month || serviceId || status) {
            query += ' WHERE ';
            const conditions: string[] = [];
            if (year) {
                conditions.push('year = ?');
                params.push(year);
            }
            if (month) {
                conditions.push('month = ?');
                params.push(month);
            }
            if (serviceId) {
                conditions.push('serviceId = ?');
                params.push(serviceId);
            }
            if (status) {
                conditions.push('status = ?');
                params.push(status);
            }
            query += conditions.join(' AND ');
        }

        const scheduleResult = await connection.execute(query, params);
        const scheduleRows = (scheduleResult && Array.isArray(scheduleResult) && scheduleResult[0]) ? scheduleResult[0] as any[] : [];
        
        const schedules: MonthlySchedule[] = [];

        for (const scheduleRow of scheduleRows) {
            const scheduleId = scheduleRow.id;

            
            let shiftsQuery = 'SELECT hd.*, e.nombre as employeeName, s.nombre_servicio as serviceName FROM `horario_detalles` hd LEFT JOIN `empleados` e ON hd.employeeId = e.id_empleado LEFT JOIN `servicios` s ON hd.serviceId = s.id_servicio WHERE hd.`horario_id` = ?';
            const shiftsParams: (string | number)[] = [scheduleId];

            if (year && month) {
                const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
                const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                shiftsQuery += ' AND hd.date BETWEEN ? AND ?';
                shiftsParams.push(startDate, endDate);
            }

            let shifts: any[] = [];
            let violationRows: any[] = [];
            
            try {
                const shiftsResult = await connection.execute(shiftsQuery, shiftsParams);
                shifts = (shiftsResult && Array.isArray(shiftsResult) && shiftsResult[0]) ? shiftsResult[0] as any[] : [];
            } catch (error) {
                console.error('Error fetching shifts:', error);
                shifts = [];
            }
            
            try {
                const violationResult = await connection.query(
                    'SELECT p.message, p.date, e.nombre as employeeName FROM `problemashorarios` p LEFT JOIN `empleados` e ON p.employeeId = e.id_empleado WHERE p.`monthlyScheduleId` = ?',
                    [scheduleId]
                );
                violationRows = (violationResult && Array.isArray(violationResult) && violationResult[0]) ? violationResult[0] as any[] : [];
            } catch (error) {
                console.error('Error fetching violations:', error);
                violationRows = [];
            }

            const violations = (violationRows as any[] ?? []).map(row => {
                try {
                    // Intenta parsear el mensaje como JSON
                    const parsed = JSON.parse(row.message);
                    // Si el parseo es exitoso y es un objeto, combínalo con los datos de la fila
                    if (typeof parsed === 'object' && parsed !== null) {
                        return { ...parsed, date: row.date, employeeName: row.employeeName || parsed.employeeName };
                    }
                } catch (e) {
                    // Si falla el parseo, es un mensaje de texto plano antiguo
                }
                // Devuelve el formato antiguo compatible
                return { details: row.message, date: row.date, employeeName: row.employeeName, rule: 'Incidencia General', severity: 'warning', category: 'serviceRule', shiftType: 'General' };
            });
            
            const scoreBreakdownResult = await connection.execute('SELECT * FROM `score_breakdowns` WHERE `monthlyScheduleId` = ?', [scheduleId]);
            const scoreBreakdown = scoreBreakdownResult ? scoreBreakdownResult[0] : [];

            schedules.push({
                ...scheduleRow,
                id: scheduleId.toString(),
                shifts: (shifts as any[] ?? []),
                violations: (violations as any[] ?? []),
                scoreBreakdown: (scoreBreakdown as any[])?.[0] ?? null,
            });
        }
        return schedules;
    } catch (error) {
        console.error("Error getting monthly schedules:", error);
        throw error;
    } finally {
        connection.release();
    }
}

import { getEmployees } from './employees';

export async function createMonthlySchedule(schedule: Omit<MonthlySchedule, 'id'>): Promise<MonthlySchedule> {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        // Si se publica un nuevo horario, archivar cualquier otro que estuviera publicado para el mismo período.
        if (schedule.status === 'published') {
            await connection.execute(
                'UPDATE horarios SET status = "archived" WHERE year = ? AND month = ? AND serviceId = ? AND status = "published"',
                [schedule.year, schedule.month, schedule.serviceId]
            );
        }

        const { shifts, violations, scoreBreakdown, horario_nombre, ...mainScheduleData } = schedule;
        const allEmployees = await getEmployees();

        const result = await connection.execute(
            'INSERT INTO horarios (scheduleKey, year, month, serviceId, serviceName, status, version, responseText, score, createdAt, updatedAt, horario_nombre) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                mainScheduleData.scheduleKey, mainScheduleData.year, mainScheduleData.month, mainScheduleData.serviceId,
                mainScheduleData.serviceName, mainScheduleData.status, mainScheduleData.version,
                mainScheduleData.responseText, mainScheduleData.score, mainScheduleData.createdAt, mainScheduleData.updatedAt,
                horario_nombre
            ]
        );

        if (!result || !result[0] || !(result[0] as any).insertId) {
            throw new Error('Failed to create new schedule, insertId is missing.');
        }
        const scheduleId = (result[0] as any).insertId;

        if (shifts && shifts.length > 0) {
            const shiftValues = shifts.map(s => {
                const employee = allEmployees.find((e: any) => e.nombre === s.employeeName);
                return [scheduleId, employee ? employee.id_empleado : null, mainScheduleData.serviceId, s.date, s.startTime, s.endTime, s.notes];
            });
            await connection.query('INSERT INTO `horario_detalles` (horario_id, employeeId, serviceId, date, startTime, endTime, notes) VALUES ?', [shiftValues]);
        }

        if (violations && violations.length > 0) {
            const violationValues = violations.map(v => {
                const employee = v.employeeName ? allEmployees.find((e: any) => e.nombre === v.employeeName) : null;
                const message = JSON.stringify({
                    rule: v.rule,
                    details: v.details,
                    severity: v.severity,
                    category: v.category,
                    shiftType: v.shiftType,
                    employeeName: v.employeeName 
                });
                return [scheduleId, employee ? employee.id_empleado : null, v.date, message];
            });
            await connection.query(
                'INSERT INTO `problemashorarios` (monthlyScheduleId, employeeId, date, message) VALUES ?',
                [violationValues]
            );
        }

        if (scoreBreakdown) {
            await connection.execute('INSERT INTO `score_breakdowns` (monthlyScheduleId, serviceRules, employeeWellbeing) VALUES (?, ?, ?)', [scheduleId, scoreBreakdown.serviceRules, scoreBreakdown.employeeWellbeing]);
        }

        await connection.commit();
        
        // Obtener y devolver el horario recién creado
        const newScheduleResult = await connection.execute('SELECT * FROM horarios WHERE id = ?', [scheduleId]);
        const newSchedule = newScheduleResult && newScheduleResult[0] ? (newScheduleResult[0] as any[])[0] : null;

        if (!newSchedule) {
            throw new Error('Failed to retrieve created schedule');
        }

        return {
            ...newSchedule,
            id: newSchedule.id.toString(),
            shifts: shifts || [],
            violations: violations || [],
            scoreBreakdown: scoreBreakdown || null,
        };

    } catch (error) {
        await connection.rollback();
        console.error("Error creating monthly schedule:", error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function updateMonthlySchedule(schedule: MonthlySchedule): Promise<void> {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();
        const scheduleId = schedule.id;

        // Si se actualiza un horario a 'publicado', archivar cualquier otro que ya lo estuviera.
        if (schedule.status === 'published') {
            await connection.execute(
                'UPDATE horarios SET status = "archived" WHERE year = ? AND month = ? AND serviceId = ? AND status = "published" AND id != ?',
                [schedule.year, schedule.month, schedule.serviceId, scheduleId]
            );
        }

        // Actualizar el registro principal del horario
        await connection.execute(
            'UPDATE horarios SET status = ?, version = ?, responseText = ?, score = ?, updatedAt = ?, horario_nombre = ? WHERE id = ?',
            [
                schedule.status ?? null,
                schedule.version + 1,
                schedule.responseText ?? null,
                schedule.score ?? null,
                Date.now(),
                schedule.horario_nombre ?? null,
                scheduleId
            ]
        );

        // Borrar detalles antiguos
        await connection.execute('DELETE FROM `horario_detalles` WHERE `horario_id` = ?', [scheduleId]);
        await connection.query('DELETE FROM `problemashorarios` WHERE `monthlyScheduleId` = ?', [scheduleId]);
        await connection.execute('DELETE FROM `score_breakdowns` WHERE `monthlyScheduleId` = ?', [scheduleId]);

        const allEmployees = await getEmployees();

        // Insertar nuevos detalles
        if (schedule.shifts && schedule.shifts.length > 0) {
            const shiftValues = schedule.shifts.map(s => {
                 const employee = allEmployees.find((e: any) => e.nombre === s.employeeName);
                return [scheduleId, employee ? employee.id_empleado : null, schedule.serviceId, s.date, s.startTime, s.endTime, s.notes];
            });
            await connection.query('INSERT INTO `horario_detalles` (horario_id, employeeId, serviceId, date, startTime, endTime, notes) VALUES ?', [shiftValues]);
        }

        if (schedule.violations && schedule.violations.length > 0) {
            const violationValues = schedule.violations.map(v => {
                const employee = v.employeeName ? allEmployees.find((e: any) => e.nombre === v.employeeName) : null;
                const message = JSON.stringify({
                    rule: v.rule,
                    details: v.details,
                    severity: v.severity,
                    category: v.category,
                    shiftType: v.shiftType,
                    employeeName: v.employeeName
                });
                return [scheduleId, employee ? employee.id_empleado : null, v.date, message];
            });
            await connection.query(
                'INSERT INTO `problemashorarios` (monthlyScheduleId, employeeId, date, message) VALUES ?',
                [violationValues]
            );
        }

        if (schedule.scoreBreakdown) {
            await connection.execute('INSERT INTO `score_breakdowns` (monthlyScheduleId, serviceRules, employeeWellbeing) VALUES (?, ?, ?)', [scheduleId, schedule.scoreBreakdown.serviceRules ?? null, schedule.scoreBreakdown.employeeWellbeing ?? null]);
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Error updating monthly schedule:", error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function getPublishedMonthlySchedule(
    year: string,
    month: string,
    serviceId: string
): Promise<MonthlySchedule | null> {
    const schedules = await getMonthlySchedules(year, month, serviceId, 'published');
    return schedules.length > 0 ? schedules[0] : null;
}

export async function getSchedulesInDateRange(
    yearFrom: string,
    monthFrom: string,
    yearTo: string,
    monthTo: string,
    serviceId?: string
): Promise<MonthlySchedule[]> {
    const connection = await getConnection();
    try {
        let query = `
            SELECT * FROM horarios
            WHERE status = 'published'
            AND (
                (year = ? AND month >= ?) OR
                (year > ? AND year < ?) OR
                (year = ? AND month <= ?)
            )
        `;
        const params: (string | number)[] = [yearFrom, monthFrom, yearFrom, yearTo, yearTo, monthTo];

        if (serviceId) {
            query += ' AND serviceId = ?';
            params.push(serviceId);
        }

        query += ' ORDER BY year ASC, month ASC';

        const scheduleResult = await connection.execute(query, params);
        const scheduleRows = scheduleResult ? scheduleResult[0] : [];
        const schedules: MonthlySchedule[] = [];

        for (const scheduleRow of scheduleRows as any[]) {
            const scheduleId = scheduleRow.id;

            const shiftsResult = await connection.execute(
                'SELECT hd.*, e.nombre as employeeName, s.nombre_servicio as serviceName FROM `horario_detalles` hd JOIN `empleados` e ON hd.employeeId = e.id_empleado JOIN `servicios` s ON hd.serviceId = s.id_servicio WHERE hd.`horario_id` = ?',
                [scheduleId]
            );
            const shifts = shiftsResult ? shiftsResult[0] : [];
            
            const violationResult = await connection.query(
                'SELECT p.message, p.date, e.nombre as employeeName FROM `problemashorarios` p LEFT JOIN `empleados` e ON p.employeeId = e.id_empleado WHERE p.`monthlyScheduleId` = ?',
                [scheduleId]
            );
            const violationRows = violationResult ? violationResult[0] : [];
            
            const violations = (violationRows as any[] ?? []).map(row => {
                try {
                    const parsed = JSON.parse(row.message);
                    if (typeof parsed === 'object' && parsed !== null) {
                        return { ...parsed, date: row.date, employeeName: row.employeeName || parsed.employeeName };
                    }
                } catch (e) {
                    // Fallback for old plain text messages
                }
                return { details: row.message, date: row.date, employeeName: row.employeeName, rule: 'Incidencia General', severity: 'warning', category: 'serviceRule', shiftType: 'General' };
            });
            
            const scoreBreakdownResult = await connection.execute('SELECT * FROM `score_breakdowns` WHERE `monthlyScheduleId` = ?', [scheduleId]);
            const scoreBreakdown = scoreBreakdownResult ? scoreBreakdownResult[0] : [];

            schedules.push({
                ...scheduleRow,
                id: scheduleId.toString(),
                shifts: (shifts as any[] ?? []),
                violations: (violations as any[] ?? []),
                scoreBreakdown: (scoreBreakdown as any[])?.[0] ?? null,
            });
        }
        return schedules;
    } catch (error) {
        console.error("Error getting schedules in date range:", error);
        throw error;
    } finally {
        connection.release();
    }
}

export function generateScheduleKey(year: string, month: string, serviceId: string): string {
    return `${year}-${month}-${serviceId}`;
}

export async function deleteMonthlySchedule(scheduleId: string): Promise<void> {
    const connection = await getConnection();
    try {
        await connection.beginTransaction();

        // Borrar detalles antiguos
        await connection.execute('DELETE FROM `horario_detalles` WHERE `horario_id` = ?', [scheduleId]);
        await connection.query('DELETE FROM `problemashorarios` WHERE `monthlyScheduleId` = ?', [scheduleId]);
        await connection.execute('DELETE FROM `score_breakdowns` WHERE `monthlyScheduleId` = ?', [scheduleId]);

        // Borrar el horario principal
        await connection.execute('DELETE FROM `horarios` WHERE `id` = ?', [scheduleId]);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.error("Error deleting monthly schedule:", error);
        throw error;
    } finally {
        connection.release();
    }
}