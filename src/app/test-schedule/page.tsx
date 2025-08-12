
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SimpleTestPage() {
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // Datos de prueba simulados
  const mockSchedule = {
    id: "23",
    horario_nombre: "Horario mucamas - mayo 2025",
    status: "published",
    shifts: [
      { employeeName: "Alamo", date: "2025-05-01", startTime: "07:00", endTime: "14:00", notes: "Turno Fijo" },
      { employeeName: "Forni", date: "2025-05-01", startTime: "07:00", endTime: "14:00", notes: "Turno Mañana" }
    ]
  };

  const handleSelectSchedule = () => {
    console.log('🎯 Selecting schedule:', mockSchedule);
    setSelectedSchedule(mockSchedule);
    console.log('✅ Schedule selected');
  };

  React.useEffect(() => {
    console.log('🔄 selectedSchedule changed:', selectedSchedule?.id);
    if (selectedSchedule) {
      console.log('📊 Shifts in selected schedule:', selectedSchedule.shifts?.length);
    }
  }, [selectedSchedule]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Page - Schedule Display</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Mock Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSelectSchedule}>
            Select Schedule: {mockSchedule.horario_nombre}
          </Button>
        </CardContent>
      </Card>

      {selectedSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Selected Schedule: {selectedSchedule.horario_nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-medium">Debug Info:</p>
              <p className="text-xs">Selected Schedule ID: {selectedSchedule?.id}</p>
              <p className="text-xs">Shifts exists: {selectedSchedule?.shifts ? 'Yes' : 'No'}</p>
              <p className="text-xs">Shifts length: {selectedSchedule?.shifts?.length || 0}</p>
              <p className="text-xs">Shifts is array: {Array.isArray(selectedSchedule?.shifts) ? 'Yes' : 'No'}</p>
            </div>

            {selectedSchedule.shifts && selectedSchedule.shifts.length > 0 ? (
              <div>
                <h3 className="font-semibold mb-2">Shifts Found!</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border px-4 py-2">Employee</th>
                        <th className="border px-4 py-2">Date</th>
                        <th className="border px-4 py-2">Time</th>
                        <th className="border px-4 py-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSchedule.shifts.map((shift, index) => (
                        <tr key={index}>
                          <td className="border px-4 py-2">{shift.employeeName}</td>
                          <td className="border px-4 py-2">{shift.date}</td>
                          <td className="border px-4 py-2">{shift.startTime} - {shift.endTime}</td>
                          <td className="border px-4 py-2">{shift.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800">No shifts found or condition failed!</p>
                <p className="text-xs">Condition: selectedSchedule.shifts && selectedSchedule.shifts.length > 0</p>
                <p className="text-xs">Result: {String(selectedSchedule.shifts && selectedSchedule.shifts.length > 0)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
