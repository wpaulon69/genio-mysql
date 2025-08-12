console.log('🔍 Verificando estructura real de las tablas...');
console.log('');

console.log('❌ Error persistente:');
console.log('Unknown column \'ep.trabaja_feriados\' in \'field list\'');
console.log('');

console.log('🤔 Posibles estructuras de empleadopreferencias:');
console.log('');

console.log('Opción 1: Tabla con columnas diferentes');
console.log('- id_empleado');
console.log('- mes');
console.log('- anio');
console.log('- [otras columnas con nombres diferentes]');
console.log('');

console.log('Opción 2: Tabla con estructura mínima');
console.log('- id_empleado');
console.log('- mes');
console.log('- anio');
console.log('- [sin columna trabaja_feriados]');
console.log('');

console.log('💡 Solución: Consulta de estructura');
console.log('Necesitamos hacer DESCRIBE empleadopreferencias para ver las columnas reales');
console.log('');

console.log('🔧 Estrategia de corrección:');
console.log('1. Simplificar consulta para usar solo columnas que sabemos que existen');
console.log('2. Usar valores por defecto para campos faltantes');
console.log('3. Hacer la funcionalidad robusta ante diferentes estructuras');
console.log('');

console.log('📝 Consulta simplificada propuesta:');
console.log('SELECT e.id_empleado, e.nombre,');
console.log('       ep.mes, ep.anio');
console.log('FROM empleados e');
console.log('LEFT JOIN empleadopreferencias ep ON e.id_empleado = ep.id_empleado');
console.log('  AND ep.mes = ? AND ep.anio = ?');
console.log('WHERE e.id_servicio = ?');
console.log('');

console.log('Y agregar valores por defecto en el código JavaScript.');