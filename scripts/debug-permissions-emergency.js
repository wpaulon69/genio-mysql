// Script de emergencia para debuggear permisos

console.log('=== EMERGENCY PERMISSIONS DEBUG ===\n');

console.log('Problema: Se perdieron todos los permisos\n');

console.log('Solución implementada:');
console.log('✅ Función hasPermission() híbrida:');
console.log('  1. Intenta usar permisos de la base de datos');
console.log('  2. Si no hay permisos de DB, usa mapeo hardcodeado como fallback\n');

console.log('Para debuggear en el navegador:');
console.log('1. Abre herramientas de desarrollador (F12)');
console.log('2. Ve a la consola');
console.log('3. Ejecuta este código:\n');

console.log(`
// Verificar sesión completa
console.log('=== SESIÓN COMPLETA ===');
console.log(JSON.stringify(session, null, 2));

// Verificar usuario específico
console.log('\\n=== USUARIO ===');
console.log('ID:', session?.user?.id);
console.log('Nombre:', session?.user?.name);
console.log('Email:', session?.user?.email);
console.log('Rol:', session?.user?.role?.name);

// Verificar permisos
console.log('\\n=== PERMISOS ===');
console.log('Permisos array:', session?.user?.permissions);
console.log('Tipo de permisos:', typeof session?.user?.permissions);
console.log('Longitud:', session?.user?.permissions?.length);

// Si los permisos están vacíos
if (!session?.user?.permissions || session?.user?.permissions.length === 0) {
  console.log('\\n❌ PERMISOS VACÍOS - Usando fallback hardcodeado');
} else {
  console.log('\\n✅ PERMISOS CARGADOS DESDE DB');
  session?.user?.permissions.forEach(perm => {
    console.log('  -', perm);
  });
}
`);

console.log('\nSi los permisos están vacíos:');
console.log('1. El sistema usará el mapeo hardcodeado como fallback');
console.log('2. Los permisos deberían funcionar normalmente');
console.log('3. Puedes acceder a todas las funcionalidades\n');

console.log('Mapeo hardcodeado para admin_hospital:');
const hardcodedPermissions = [
  'MANAGE_USERS',
  'MANAGE_ALL_SERVICES',
  'MANAGE_ALL_EMPLOYEES',
  'VIEW_ALL_SERVICES',
  'VIEW_ALL_EMPLOYEES',
  'VIEW_ALL_REPORTS',
  'MANAGE_HOLIDAYS', // ← Este debería funcionar ahora
  'APPROVE_SHIFT_CHANGES'
];

hardcodedPermissions.forEach(perm => {
  const isHolidays = perm === 'MANAGE_HOLIDAYS';
  console.log(`${isHolidays ? '🎯' : '  '} ${perm}`);
});

console.log('\nPróximos pasos:');
console.log('1. Probar acceso a /holidays (debería funcionar con fallback)');
console.log('2. Si funciona, investigar por qué no se cargan permisos de DB');
console.log('3. Si no funciona, revisar mapeo hardcodeado\n');

console.log('=== DEBUG COMPLETE ===');

module.exports = { hardcodedPermissions };