"use client";

import React, { useState, useEffect, useMemo } from 'react';
import type { AIShift } from '@/ai/flows/suggest-shift-schedule';
import type { Employee, Service, Holiday, InteractiveScheduleGridProps } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { format, getDaysInMonth, getDay as getDayOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, RefreshCw, Save } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SHIFT_OPTIONS, type GridShiftType } from '@/lib/constants/schedule-constants';
import { cn } from '@/lib/utils';
import { getShiftType } from '@/lib/scheduler/utils';
import ScheduleEvaluationDisplay from './schedule-evaluation-display';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';

const getShiftCellColorClass = (shiftType: GridShiftType): string => {
  switch (shiftType) {
    case 'M': return 'shift-m';
    case 'T': return 'shift-t';
    case 'N': return 'shift-n';
    case 'D': return 'shift-d';
    case 'F': return 'shift-f';
    case 'C': return 'shift-c';
    case 'LAO': return 'shift-lao';
    case 'LM': return 'shift-lm';
    case '_EMPTY_':
    case '':
    default:
      return 'shift-empty';
  }
};

export default function InteractiveScheduleGrid({
  initialShifts,
  initialScheduleName,
  allEmployees,
  targetService,
  month,
  year,
  holidays = [],
  onShiftsChange,
  onScheduleNameChange,
  onBackToConfig,
  isReadOnly = false,
  onSave,
  isSaving = false,
  onEvaluationComplete,
}: InteractiveScheduleGridProps) {
  const [scheduleName, setScheduleName] = useState(initialScheduleName || '');
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isConfirmExitOpen, setIsConfirmExitOpen] = useState(false);

  const monthDate = useMemo(() => new Date(parseInt(year), parseInt(month, 10) - 1, 1), [year, month]);
  const daysInMonth = useMemo(() => getDaysInMonth(monthDate), [monthDate]);

  const relevantEmployeeNames = useMemo(() => {
    const names = new Set<string>();
    if (targetService) {
      allEmployees.forEach((emp: Employee) => {
        if (emp.id_servicio === targetService.id_servicio) {
          names.add(emp.nombre);
        }
      });
    }
    initialShifts.forEach(s => names.add(s.employeeName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allEmployees, targetService, initialShifts]);

  const [editableShifts, setEditableShifts] = useState<AIShift[]>(() => {
    if (!targetService || relevantEmployeeNames.length === 0) {
      return [...initialShifts];
    }
    const initialShiftsMap = new Map<string, AIShift>();
    initialShifts.forEach(shift => {
      if (shift.date && shift.employeeName) {
        const dateKey = new Date(shift.date).toISOString().slice(0, 10);
        initialShiftsMap.set(`${shift.employeeName}-${dateKey}`, shift);
      }
    });
    const fullSchedule: AIShift[] = [];
    relevantEmployeeNames.forEach(employeeName => {
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const existingShift = initialShiftsMap.get(`${employeeName}-${dateStr}`);
        if (existingShift) {
          fullSchedule.push({ ...existingShift, date: dateStr });
        } else {
          fullSchedule.push({
            date: dateStr,
            employeeName: employeeName,
            serviceName: targetService.nombre_servicio,
            startTime: '',
            endTime: '',
            notes: '_EMPTY_',
          });
        }
      }
    });
    return fullSchedule;
  });

  useEffect(() => {
    setScheduleName(initialScheduleName || '');
  }, [initialScheduleName]);

  const handleReevaluate = async () => {
    if (!targetService) return;
    setIsEvaluating(true);
    try {
      const prevMonthDate = new Date(parseInt(year), parseInt(month, 10) - 2, 1);
      const prevMonth = prevMonthDate.getMonth() + 1;
      const prevYear = prevMonthDate.getFullYear();

      const prevMonthShiftsResponse = await fetch(`/api/monthlySchedules?year=${prevYear}&month=${prevMonth}&serviceId=${targetService.id_servicio}`);
      let previousMonthShifts = null;
      if (prevMonthShiftsResponse.ok) {
        const prevSchedules = await prevMonthShiftsResponse.json();
        if (prevSchedules.length > 0) previousMonthShifts = prevSchedules[0].shifts;
      }

      const response = await fetch('/api/evaluate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts: editableShifts, service: targetService, month, year, employees: allEmployees, holidays, previousMonthShifts }),
      });

      if (!response.ok) throw new Error((await response.json()).message || 'Error al evaluar');

      const result = await response.json();
      setEvaluationResult(result);
      if (onEvaluationComplete) onEvaluationComplete(result);
    } catch (error) {
      // Silently handle error
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleSave = async (status: 'published' | 'draft') => {
    if (!onSave) return;

    setIsEvaluating(true);
    let currentEvaluationResult = evaluationResult;

    try {
      // Forzar re-evaluación antes de guardar
      const prevMonthDate = new Date(parseInt(year), parseInt(month, 10) - 2, 1);
      const prevMonth = prevMonthDate.getMonth() + 1;
      const prevYear = prevMonthDate.getFullYear();

      const prevMonthShiftsResponse = await fetch(`/api/monthlySchedules?year=${prevYear}&month=${prevMonth}&serviceId=${targetService?.id_servicio}`);
      let previousMonthShifts = null;
      if (prevMonthShiftsResponse.ok) {
        const prevSchedules = await prevMonthShiftsResponse.json();
        if (prevSchedules.length > 0) previousMonthShifts = prevSchedules[0].shifts;
      }

      const response = await fetch('/api/evaluate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shifts: editableShifts, service: targetService, month, year, employees: allEmployees, holidays, previousMonthShifts }),
      });

      if (response.ok) {
        currentEvaluationResult = await response.json();
        setEvaluationResult(currentEvaluationResult);
        if (onEvaluationComplete) onEvaluationComplete(currentEvaluationResult);
      } else {
        console.error("No se pudo re-evaluar antes de guardar, se guardará sin evaluación actualizada.");
      }
    } catch (error) {
      console.error("Error en la re-evaluación automática:", error);
    } finally {
      setIsEvaluating(false);
      onSave(editableShifts, status, currentEvaluationResult);
      setHasUnsavedChanges(false);
      setIsSaveModalOpen(false);
    }
  };

  const dayHeaders = useMemo(() => {
    const holidayDates = new Set(holidays.map(h => h.date.slice(0, 10)));
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const date = new Date(parseInt(year), parseInt(month, 10) - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = getDayOfWeek(date);
      return {
        dayNumber: day,
        shortName: format(date, 'eee', { locale: es }),
        isSpecialDay: dayOfWeek === 0 || dayOfWeek === 6 || holidayDates.has(dateStr),
      };
    });
  }, [daysInMonth, month, year, holidays]);

  const gridData = useMemo(() => {
    const data: { [employeeName: string]: { [day: number]: AIShift | null } } = {};
    relevantEmployeeNames.forEach(name => (data[name] = {}));
    editableShifts.forEach(shift => {
      if (shift.date && shift.employeeName) {
        const dayOfMonth = parseInt(shift.date.slice(8, 10), 10);
        data[shift.employeeName][dayOfMonth] = shift;
      }
    });
    return data;
  }, [editableShifts, relevantEmployeeNames]);

  const employeeStats = useMemo(() => {
    const stats: { [key: string]: { totalD: number; totalWork: number } } = {};
    relevantEmployeeNames.forEach(name => {
      stats[name] = { totalD: 0, totalWork: 0 };
      for (let day = 1; day <= daysInMonth; day++) {
        const shiftType = getShiftType(gridData[name]?.[day]);
        if (shiftType === 'D') stats[name].totalD++;
        else if (['M', 'T', 'N'].includes(shiftType)) stats[name].totalWork++;
      }
    });
    return stats;
  }, [gridData, relevantEmployeeNames, daysInMonth]);

  const handleShiftChange = (employeeName: string, day: number, selectedShiftValue: GridShiftType) => {
    if (isReadOnly || !onShiftsChange) return;
    const shiftDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const selectedOption = SHIFT_OPTIONS.find(opt => opt.value === selectedShiftValue);

    const newShifts = editableShifts.map(shift => {
      if (shift.employeeName === employeeName && shift.date === shiftDateStr) {
        return { ...shift, startTime: selectedOption?.startTime || '', endTime: selectedOption?.endTime || '', notes: selectedShiftValue === '_EMPTY_' ? '_EMPTY_' : (selectedOption?.label || '') };
      }
      return shift;
    });
    setEditableShifts(newShifts);
    onShiftsChange(newShifts);
    setHasUnsavedChanges(true);
  };

  const dailyTotals = useMemo(() => {
    const totals: { [key: number]: { M: number; T: number; N: number; totalStaff: number } } = {};
    for (let day = 1; day <= daysInMonth; day++) {
      totals[day] = { M: 0, T: 0, N: 0, totalStaff: 0 };
      relevantEmployeeNames.forEach(name => {
        const shiftType = getShiftType(gridData[name]?.[day]);
        if (shiftType === 'M') totals[day].M++;
        else if (shiftType === 'T') totals[day].T++;
        else if (shiftType === 'N') totals[day].N++;
        if (['M', 'T', 'N'].includes(shiftType)) totals[day].totalStaff++;
      });
    }
    return totals;
  }, [gridData, daysInMonth, relevantEmployeeNames]);

  const monthName = format(monthDate, 'MMMM', { locale: es });
  const currentYearStr = format(monthDate, 'yyyy');

  return (
    <>
      <Card className="mt-6 w-full">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-grow">
            <Label htmlFor="schedule-name-input" className="text-sm font-medium text-muted-foreground">Nombre del Horario</Label>
            <Input id="schedule-name-input" type="text" value={scheduleName} onChange={e => { setScheduleName(e.target.value); if (onScheduleNameChange) onScheduleNameChange(e.target.value); setHasUnsavedChanges(true); }} placeholder={`Ej: Horario ${targetService?.nombre_servicio} - ${monthName} ${currentYearStr}`} className="text-lg font-headline mt-1" disabled={isReadOnly} />
            {!isReadOnly && <p className="text-sm text-muted-foreground">Puede editar los turnos manualmente. Use '-' para vaciar una celda.</p>}
          </div>
          {!isReadOnly && onBackToConfig && <Button onClick={() => { if (hasUnsavedChanges) { setIsConfirmExitOpen(true); } else { onBackToConfig(); } }} variant="outline"><ChevronLeft className="mr-2 h-4 w-4" /> Volver</Button>}
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-card z-20 truncate w-[180px] min-w-[180px]">Empleado</TableHead>
                  <TableHead className="sticky bg-card z-20 text-center w-[80px] min-w-[80px]" style={{ left: 180 }}>Total D</TableHead>
                  {dayHeaders.map(h => <TableHead key={h.dayNumber} className={cn("text-center w-[70px] min-w-[70px]", h.isSpecialDay && "bg-pink-100 dark:bg-pink-900")}><div className={cn(h.isSpecialDay && "text-pink-600 dark:text-pink-400")}>{h.dayNumber}</div><div className="text-xs text-muted-foreground">{h.shortName}</div></TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {relevantEmployeeNames.map(name => (
                  <TableRow key={name}>
                    <TableCell className="sticky left-0 bg-card z-10 font-medium truncate w-[180px] min-w-[180px]">{name}</TableCell>
                    <TableCell className="sticky bg-card z-10 font-medium text-center w-[80px] min-w-[80px]" style={{ left: 180 }}>{employeeStats[name]?.totalD || 0}</TableCell>
                    {dayHeaders.map(h => {
                      const shift = gridData[name]?.[h.dayNumber];
                      const shiftType = getShiftType(shift);
                      return (
                        <TableCell key={`${name}-${h.dayNumber}`} className="p-1 w-[70px] min-w-[70px]">
                          <Select value={shiftType || '_EMPTY_'} onValueChange={v => handleShiftChange(name, h.dayNumber, v as GridShiftType)} disabled={isReadOnly}>
                            <SelectTrigger className={cn("h-8 w-full text-xs px-2", getShiftCellColorClass(shiftType))}><SelectValue placeholder="-" /></SelectTrigger>
                            <SelectContent>
                              {SHIFT_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.displayValue}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted font-semibold">
                  <TableCell className="sticky left-0 bg-muted z-10 w-[180px] min-w-[180px]">TPM</TableCell>
                  <TableCell className="sticky left-180 bg-muted z-10 w-[80px] min-w-[80px]"></TableCell>
                  {dayHeaders.map(h => <TableCell key={`m-${h.dayNumber}`} className="text-center">{dailyTotals[h.dayNumber]?.M || 0}</TableCell>)}
                </TableRow>
                <TableRow className="bg-muted font-semibold">
                  <TableCell className="sticky left-0 bg-muted z-10 w-[180px] min-w-[180px]">TPT</TableCell>
                  <TableCell className="sticky left-180 bg-muted z-10 w-[80px] min-w-[80px]"></TableCell>
                  {dayHeaders.map(h => <TableCell key={`t-${h.dayNumber}`} className="text-center">{dailyTotals[h.dayNumber]?.T || 0}</TableCell>)}
                </TableRow>
                {targetService?.habilitar_turno_noche && <TableRow className="bg-muted font-semibold">
                  <TableCell className="sticky left-0 bg-muted z-10 w-[180px] min-w-[180px]">Total Noche (N)</TableCell>
                  <TableCell className="sticky left-180 bg-muted z-10 w-[80px] min-w-[80px]"></TableCell>
                  {dayHeaders.map(h => <TableCell key={`n-${h.dayNumber}`} className="text-center">{dailyTotals[h.dayNumber]?.N || 0}</TableCell>)}
                </TableRow>}
                <TableRow className="bg-muted font-bold text-base">
                  <TableCell className="sticky left-0 bg-muted z-10 w-[180px] min-w-[180px]">TOTAL PERSONAL</TableCell>
                  <TableCell className="sticky left-180 bg-muted z-10 w-[80px] min-w-[80px]"></TableCell>
                  {dayHeaders.map(h => <TableCell key={`staff-${h.dayNumber}`} className="text-center">{dailyTotals[h.dayNumber]?.totalStaff || 0}</TableCell>)}
                </TableRow>
              </TableFooter>
            </Table>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {evaluationResult && <div className="mt-4"><ScheduleEvaluationDisplay {...evaluationResult} /></div>}

      {!isReadOnly && (
        <div className="mt-6 flex justify-between">
          <Button onClick={handleReevaluate} disabled={isEvaluating} variant="outline"><RefreshCw className={`mr-2 h-4 w-4 ${isEvaluating ? 'animate-spin' : ''}`} /> Re-evaluar</Button>
          <Button onClick={() => setIsSaveModalOpen(true)} disabled={isSaving}>{isSaving ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isSaving ? 'Guardando...' : 'Guardar Cambios'}</Button>
        </div>
      )}

      <AlertDialog open={isSaveModalOpen} onOpenChange={setIsSaveModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar Guardado</AlertDialogTitle><AlertDialogDescription>Seleccione cómo desea guardar el horario.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="sm:flex-col md:flex-row md:justify-end space-y-2 md:space-y-0 md:space-x-2">
            <Button onClick={() => handleSave('draft')} variant="outline" disabled={isSaving}>Guardar como Borrador</Button>
            <Button onClick={() => handleSave('published')} disabled={isSaving}>Publicar Horario</Button>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isConfirmExitOpen} onOpenChange={setIsConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tiene cambios sin guardar. ¿Está seguro de que desea salir? Se perderán todos los cambios no guardados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onBackToConfig}>Salir sin Guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
