require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

const config = {
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'hospital_schedule',
    port: process.env.MYSQL_PORT || 3306,
};

async function debugScheduleData() {
    let connection;

    try {
        connection = await mysql.createConnection(config);
        console.log('Conectado a la base de datos');

        // Obtener el horario específico
        const [schedules] = await connection.execute(`
      SELECT * FROM horarios 
      WHERE year = '2025' AND month = '5' AND serviceId = 1
    `);

        console.log('\n📅 Horarios encontrados:');
        schedules.forEach(schedule => {
            console.log('Schedule:', {
                id: schedule.id,
                horario_nombre: schedule.horario_nombre,
                status: schedule.status,
                score: schedule.score
            });
        });

        if (schedules.length > 0) {
            const scheduleId = schedules[0].id;

            // Obtener los detalles del horario
            const [shifts] = await connection.execute(`
        SELECT 
          hd.*,
          e.nombre as employeeName,
          s.nombre_servicio as serviceName
        FROM horario_detalles hd
        LEFT JOIN empleados e ON hd.employeeId = e.id_empleado
        LEFT JOIN servicios s ON hd.serviceId = s.id_servicio
        WHERE hd.horario_id = ?
        ORDER BY hd.date, e.nombre
      `, [scheduleId]);

            console.log(`\n📊 Turnos encontrados para horario ${scheduleId}: ${shifts.length}`);

            if (shifts.length > 0) {
                console.log('\nPrimeros 5 turnos:');
                shifts.slice(0, 5).forEach((shift, i) => {
                    console.log(`${i + 1}.`, {
                        employeeName: shift.employeeName,
                        date: shift.date,
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        notes: shift.notes
                    });
                });

                // Agrupar por empleado
                const employeeShifts = {};
                shifts.forEach(shift => {
                    if (!employeeShifts[shift.employeeName]) {
                        employeeShifts[shift.employeeName] = [];
                    }
                    employeeShifts[shift.employeeName].push(shift);
                });

                console.log('\n👥 Turnos por empleado:');
                Object.keys(employeeShifts).forEach(employeeName => {
                    console.log(`- ${employeeName}: ${employeeShifts[employeeName].length} turnos`);
                });
            } else {
                console.log('❌ No se encontraron turnos para este horario');
            }

            // Verificar empleados del servicio
            const [employees] = await connection.execute(`
        SELECT id_empleado, nombre 
        FROM empleados 
        WHERE id_servicio = 1
        ORDER BY nombre
      `);

            console.log(`\n👥 Empleados del servicio: ${employees.length}`);
            employees.forEach(emp => {
                console.log(`- ${emp.nombre} (ID: ${emp.id_empleado})`);
            });
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

debugScheduleData();