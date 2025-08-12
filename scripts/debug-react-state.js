// Simulación del flujo de React para depurar el problema de estado

console.log('🔍 Simulando flujo de React...');

// Simular datos que llegan de la API
const mockScheduleFromAPI = {
  id: "23",
  scheduleKey: "2025-5-1",
  year: "2025",
  month: "5",
  serviceId: "1",
  serviceName: "mucamas",
  horario_nombre: "Horario mucamas - mayo 2025",
  status: "published",
  score: 93,
  shifts: [
    { employeeName: "Alamo", date: "2025-05-01T03:00:00.000Z", startTime: "07:00", endTime: "14:00", notes: "Turno Fijo" },
    { employeeName: "Forni", date: "2025-05-01T03:00:00.000Z", startTime: "07:00", endTime: "14:00", notes: "Turno Mañana" }
  ],
  violations: [],
  scoreBreakdown: null,
  createdAt: 1754474288076,
  updatedAt: 1754474288076
};

const mockServiceInfo = {
  id_servicio: 1,
  nombre_servicio: "mucamas"
};

const mockEmployees = [
  { id_empleado: 1, nombre: "Alamo" },
  { id_empleado: 2, nombre: "Forni" }
];

console.log('\n📊 Datos simulados:');
console.log('- Schedule ID:', mockScheduleFromAPI.id);
console.log('- Schedule shifts length:', mockScheduleFromAPI.shifts.length);
console.log('- Service info exists:', !!mockServiceInfo);
console.log('- Employees length:', mockEmployees.length);

// Simular el estado de React
let selectedScheduleToDisplay = null;

console.log('\n🔄 Estado inicial:');
console.log('- selectedScheduleToDisplay:', selectedScheduleToDisplay);

// Simular el onClick
console.log('\n🎯 Simulando onClick...');
selectedScheduleToDisplay = mockScheduleFromAPI;
console.log('- selectedScheduleToDisplay después del click:', !!selectedScheduleToDisplay);
console.log('- selectedScheduleToDisplay.id:', selectedScheduleToDisplay?.id);

// Simular las condiciones del render
console.log('\n🔍 Verificando condiciones de render:');
console.log('- selectedScheduleToDisplay exists:', !!selectedScheduleToDisplay);
console.log('- serviceInfo exists:', !!mockServiceInfo);
console.log('- Condition (selectedScheduleToDisplay && serviceInfo):', !!(selectedScheduleToDisplay && mockServiceInfo));

// Simular props para ScheduleView
if (selectedScheduleToDisplay && mockServiceInfo) {
  console.log('\n✅ ScheduleView debería renderizarse con:');
  console.log('- shifts:', selectedScheduleToDisplay.shifts?.length || 0);
  console.log('- employees:', mockEmployees.length);
  console.log('- services:', [mockServiceInfo].length);
  console.log('- scheduleId:', selectedScheduleToDisplay.id);
  
  // Verificar que ScheduleView puede procesar estos datos
  const scheduleViewProps = {
    shifts: selectedScheduleToDisplay.shifts || [],
    employees: mockEmployees,
    services: [mockServiceInfo],
    scheduleId: selectedScheduleToDisplay.id
  };
  
  console.log('\n🧩 Props para ScheduleView:');
  Object.keys(scheduleViewProps).forEach(key => {
    const value = scheduleViewProps[key];
    console.log(`- ${key}:`, Array.isArray(value) ? `Array(${value.length})` : typeof value, value);
  });
} else {
  console.log('\n❌ ScheduleView NO se renderizaría');
  console.log('- selectedScheduleToDisplay:', !!selectedScheduleToDisplay);
  console.log('- serviceInfo:', !!mockServiceInfo);
}

console.log('\n🎉 Simulación completada. Si todo se ve bien aquí, el problema está en React/frontend.');