// Script para debuggear permisos del usuario

console.log('=== DEBUGGING USER PERMISSIONS ===\n');

console.log('Problema identificado:');
console.log('- La función hasPermission() estaba usando ROLE_PERMISSIONS hardcodeado');
console.log('- Ahora usa user.permissions desde la base de datos\n');

console.log('Corrección aplicada:');
console.log('✅ hasPermission() ahora usa user.permissions directamente');
console.log('✅ No más mapeo hardcodeado ROLE_PERMISSIONS\n');

console.log('Para debuggear en el navegador:');
console.log('1. Abre las herramientas de desarrollador (F12)');
console.log('2. Ve a la consola');
console.log('3. Ejecuta este código:\n');

console.log(`
// Verificar sesión del usuario
console.log('Sesión:', JSON.stringify(session?.user, null, 2));

// Verificar permisos específicos
console.log('Permisos:', session?.user?.permissions);

// Verificar permiso específico de feriados
console.log('Tiene manage_holidays:', session?.user?.permissions?.includes('manage_holidays'));

// Verificar rol
console.log('Rol:', session?.user?.role?.name);
`);

console.log('\nSi los permisos están vacíos o son IDs numéricos:');
console.log('1. Haz logout completo');
console.log('2. Haz login nuevamente');
console.log('3. Los permisos deberían cargarse correctamente\n');

console.log('Permisos esperados para admin_hospital:');
const expectedPermissions = [
  'manage_users',
  'manage_all_services',
  'manage_all_employees',
  'view_all_services',
  'view_all_employees',
  'view_all_reports',
  'manage_holidays', // ← Este es el importante
  'approve_shift_changes'
];

expectedPermissions.forEach(perm => {
  const isHolidays = perm === 'manage_holidays';
  console.log(`${isHolidays ? '🎯' : '  '} ${perm}`);
});

console.log('\n=== DEBUG COMPLETE ===');

module.exports = { expectedPermissions };