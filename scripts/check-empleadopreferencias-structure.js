console.log('🔍 Verificando estructura de tabla empleadopreferencias...');
console.log('');

console.log('❌ Error actual:');
console.log('Unknown column \'ep.trabaja_feriados\' in \'field list\'');
console.log('');

console.log('🤔 Posibles causas:');
console.log('1. La tabla empleadopreferencias no existe');
console.log('2. Las columnas tienen nombres diferentes');
console.log('3. La estructura de la tabla es diferente a la esperada');
console.log('');

console.log('🔧 Solución temporal:');
console.log('Voy a modificar el endpoint para que funcione solo con la tabla empleados');
console.log('y maneje las preferencias de forma más simple.');
console.log('');

console.log('📝 Estructura esperada de empleadopreferencias:');
console.log('- id_empleado (FK)');
console.log('- mes');
console.log('- anio');
console.log('- trabaja_feriados');
console.log('- elegible_franco_pos_guardia');
console.log('- prefiere_trabajar_fines_semana');
console.log('- disponibilidad_general');
console.log('- restricciones_especificas');
console.log('');

console.log('💡 Alternativa:');
console.log('Si la tabla no existe o tiene estructura diferente,');
console.log('podemos usar solo la tabla empleados con valores por defecto.');