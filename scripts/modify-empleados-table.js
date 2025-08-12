const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function modifyEmpleadosTable() {
    const connection = await mysql.createConnection({
        host: process.env.MYSQL_HOST || 'localhost',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    });

    try {
        console.log('🔧 MODIFICANDO TABLA EMPLEADOS\n');

        // 1. Verificar estructura actual
        console.log('📋 Estructura actual de la tabla empleados:');
        const [currentStructure] = await connection.execute(`
      DESCRIBE empleados
    `);

        currentStructure.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default || ''}`);
        });

        // 2. Verificar si id_servicio ya permite NULL
        const serviceColumn = currentStructure.find(col => col.Field === 'id_servicio');

        if (serviceColumn && serviceColumn.Null === 'YES') {
            console.log('\n✅ La columna id_servicio ya permite NULL');
        } else {
            console.log('\n🔧 Modificando columna id_servicio para permitir NULL...');

            // Modificar la columna para permitir NULL
            await connection.execute(`
        ALTER TABLE empleados 
        MODIFY COLUMN id_servicio INT NULL
      `);

            console.log('✅ Columna id_servicio modificada exitosamente');
        }

        // 3. Verificar empleados actuales por servicio
        console.log('\n📊 ESTADO ACTUAL DE EMPLEADOS:');

        const [employeeStats] = await connection.execute(`
      SELECT 
        CASE 
          WHEN e.id_servicio IS NULL THEN 'Sin Servicio'
          ELSE s.nombre_servicio 
        END as servicio,
        COUNT(*) as total_empleados,
        GROUP_CONCAT(e.nombre ORDER BY e.nombre ASC SEPARATOR ', ') as empleados
      FROM empleados e
      LEFT JOIN servicios s ON e.id_servicio = s.id_servicio
      GROUP BY 
        CASE 
          WHEN e.id_servicio IS NULL THEN 'Sin Servicio'
          ELSE s.nombre_servicio 
        END
      ORDER BY servicio
    `);

        employeeStats.forEach(stat => {
            console.log(`\n🏥 ${stat.servicio}:`);
            console.log(`  👥 ${stat.total_empleados} empleados`);
            if (stat.empleados) {
                console.log(`  📋 ${stat.empleados}`);
            }
        });

        // 4. Crear algunos empleados sin servicio para testing
        console.log('\n🧪 Creando empleados de prueba sin servicio...');

        const testEmployees = [
            {
                nombre: 'Ana Martinez',
                email: 'ana.martinez@hospital.com'
            },
            {
                nombre: 'Carlos Rodriguez',
                email: 'carlos.rodriguez@hospital.com'
            },
            {
                nombre: 'Sofia Herrera',
                email: 'sofia.herrera@hospital.com'
            }
        ];

        for (const employee of testEmployees) {
            // Verificar si ya existe
            const [existing] = await connection.execute(`
        SELECT id_empleado FROM empleados WHERE email_empleado = ?
      `, [employee.email]);

            if (existing.length === 0) {
                await connection.execute(`
          INSERT INTO empleados (
            id_servicio,
            nombre, 
            email_empleado,
            elegible_franco_pos_guardia,
            prefiere_trabajar_fines_semana,
            trabaja_feriados
          ) VALUES (NULL, ?, ?, 0, 0, 0)
        `, [employee.nombre, employee.email]);

                console.log(`✅ Creado: ${employee.nombre} (sin servicio)`);
            } else {
                console.log(`⚠️  Ya existe: ${employee.nombre}`);
            }
        }

        // 5. Verificar resultado final
        console.log('\n📊 RESULTADO FINAL:');

        const [finalStats] = await connection.execute(`
      SELECT 
        COUNT(CASE WHEN id_servicio IS NULL THEN 1 END) as sin_servicio,
        COUNT(CASE WHEN id_servicio IS NOT NULL THEN 1 END) as con_servicio,
        COUNT(*) as total
      FROM empleados
    `);

        const stats = finalStats[0];
        console.log(`  👥 Total empleados: ${stats.total}`);
        console.log(`  🏥 Con servicio: ${stats.con_servicio}`);
        console.log(`  🆓 Sin servicio: ${stats.sin_servicio}`);

        // 6. Mostrar empleados sin servicio
        if (stats.sin_servicio > 0) {
            console.log('\n🆓 EMPLEADOS SIN SERVICIO ASIGNADO:');
            const [unassigned] = await connection.execute(`
        SELECT nombre, email_empleado
        FROM empleados 
        WHERE id_servicio IS NULL
        ORDER BY nombre ASC
      `);

            unassigned.forEach(emp => {
                console.log(`  - ${emp.nombre} (${emp.email_empleado})`);
            });
        }

        console.log('\n🎉 ¡Modificación completada exitosamente!');
        console.log('\n💡 Ahora los empleados pueden existir sin servicio asignado');
        console.log('🎯 Los admins pueden asignarlos a servicios según necesidad');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

modifyEmpleadosTable();