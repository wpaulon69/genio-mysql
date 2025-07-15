"use client";

import type { ScheduleComparisonReportOutput } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3 } from 'lucide-react';

interface ScheduleComparisonDisplayProps {
  data: ScheduleComparisonReportOutput;
}

export default function ScheduleComparisonDisplay({ data }: ScheduleComparisonDisplayProps) {
  if (!data || !data.data || data.data.length === 0) {
    return <p>No hay datos de comparación de horarios para mostrar.</p>;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="mr-2 h-5 w-5" />
          Informe Comparativo de Horarios
        </CardTitle>
        <CardDescription>
          Comparación de métricas clave para el servicio de {data.serviceNameLabel} en el período de {data.dateRangeLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mes</TableHead>
              <TableHead className="text-center">Puntuación</TableHead>
              <TableHead className="text-center">Incidencias Totales</TableHead>
              <TableHead className="text-center">Errores</TableHead>
              <TableHead className="text-center">Advertencias</TableHead>
              <TableHead className="text-center">Días de Trabajo</TableHead>
              <TableHead className="text-center">Días de Descanso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.data.map((metric) => (
              <TableRow key={metric.month}>
                <TableCell className="font-medium">{metric.month}</TableCell>
                <TableCell className="text-center">{metric.score?.toFixed(0) ?? 'N/A'}</TableCell>
                <TableCell className="text-center">{metric.totalViolations}</TableCell>
                <TableCell className="text-center text-red-600">{metric.errorViolations}</TableCell>
                <TableCell className="text-center text-yellow-600">{metric.warningViolations}</TableCell>
                <TableCell className="text-center">{metric.workDays}</TableCell>
                <TableCell className="text-center">{metric.restDays}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
