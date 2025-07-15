
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BarChartBig, Loader2, Users, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Service, Employee } from '@/lib/types';

const currentReportYear = new Date().getFullYear();
const reportYears = Array.from({ length: 10 }, (_, i) => (currentReportYear - 7 + i).toString());
const reportMonths = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: format(new Date(2000, i), 'MMMM', { locale: es }),
}));

const ALL_SERVICES_VALUE = "__ALL_SERVICES_COMPARISON__";

const reportFilterSchema = z.object({
  reportType: z.enum(["employeeComparison", "scheduleQuality", "scheduleComparison"]),
  reportText: z.string().optional(),
  monthFrom: z.string().optional(),
  yearFrom: z.string().optional(),
  monthTo: z.string().optional(),
  yearTo: z.string().optional(),
  serviceIdForComparison: z.string().optional(),
  // Fields for scheduleQuality report
  serviceIdForScheduleQuality: z.string().optional(),
  monthForScheduleQuality: z.string().optional(),
  yearForScheduleQuality: z.string().optional(),
})
.superRefine((data, ctx) => {
  if (data.reportType === 'employeeComparison') {
    if (!data.monthFrom) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mes Desde es obligatorio.", path: ["monthFrom"] });
    if (!data.yearFrom) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Año Desde es obligatorio.", path: ["yearFrom"] });
    if (!data.monthTo) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mes Hasta es obligatorio.", path: ["monthTo"] });
    if (!data.yearTo) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Año Hasta es obligatorio.", path: ["yearTo"] });

    if (data.yearFrom && data.monthFrom && data.yearTo && data.monthTo) {
      const dateFrom = new Date(parseInt(data.yearFrom), parseInt(data.monthFrom) - 1);
      const dateTo = new Date(parseInt(data.yearTo), parseInt(data.monthTo) - 1);
      if (dateFrom > dateTo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "La fecha 'Desde' no puede ser posterior a la fecha 'Hasta'.", path: ["monthFrom"] });
      }
    }
  } else if (data.reportType === 'scheduleQuality') {
    if (!data.serviceIdForScheduleQuality) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Servicio es obligatorio.", path: ["serviceIdForScheduleQuality"] });
    if (!data.monthForScheduleQuality) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mes es obligatorio.", path: ["monthForScheduleQuality"] });
    if (!data.yearForScheduleQuality) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Año es obligatorio.", path: ["yearForScheduleQuality"] });
  }
});

type ReportFilterFormData = z.infer<typeof reportFilterSchema>;

interface ReportFiltersProps {
  onGenerateReport: (filters: ReportFilterFormData) => void;
  isLoading: boolean;
  services: Service[];
  employees: Employee[]; // employees might not be needed here if not used for scheduleQuality filters
}

export default function ReportFilters({ onGenerateReport, isLoading, services }: ReportFiltersProps) {
  const form = useForm<ReportFilterFormData>({
    resolver: zodResolver(reportFilterSchema),
    defaultValues: {
      reportType: 'employeeComparison',
      monthFrom: (new Date().getMonth()).toString(),
      yearFrom: new Date().getFullYear().toString(),
      monthTo: (new Date().getMonth() + 1).toString(),
      yearTo: new Date().getFullYear().toString(),
      serviceIdForComparison: ALL_SERVICES_VALUE,
      serviceIdForScheduleQuality: services.length > 0 ? services[0].id_servicio.toString() : '',
      monthForScheduleQuality: (new Date().getMonth() + 1).toString(),
      yearForScheduleQuality: new Date().getFullYear().toString(),
    },
  });

  const reportType = form.watch('reportType');

  const handleSubmit = (data: ReportFilterFormData) => {
    onGenerateReport(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Opciones de Informe</CardTitle>
        <CardDescription>Seleccione los parámetros para generar su informe.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Informe</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un tipo de informe" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="employeeComparison">Análisis Comparativo de Empleados</SelectItem>
                      <SelectItem value="scheduleQuality">Análisis de Calidad de Horario</SelectItem>
                      <SelectItem value="scheduleComparison">Informe Comparativo de Horarios</SelectItem>
                      {/* <SelectItem value="employeeUtilization" disabled>Utilización de Empleados (próximamente)</SelectItem> */}
                      {/* <SelectItem value="serviceUtilization" disabled>Utilización de Servicios (próximamente)</SelectItem> */}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {reportType === 'employeeComparison' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="monthFrom" render={({ field }) => (
                    <FormItem> <FormLabel>Mes Desde</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Mes Desde" /></SelectTrigger></FormControl>
                        <SelectContent>{reportMonths.map(m => (<SelectItem key={`from-${m.value}`} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="yearFrom" render={({ field }) => (
                    <FormItem> <FormLabel>Año Desde</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Año Desde" /></SelectTrigger></FormControl>
                        <SelectContent>{reportYears.map(y => (<SelectItem key={`from-${y}`} value={y}>{y}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="monthTo" render={({ field }) => (
                    <FormItem> <FormLabel>Mes Hasta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Mes Hasta" /></SelectTrigger></FormControl>
                        <SelectContent>{reportMonths.map(m => (<SelectItem key={`to-${m.value}`} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="yearTo" render={({ field }) => (
                    <FormItem> <FormLabel>Año Hasta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Año Hasta" /></SelectTrigger></FormControl>
                        <SelectContent>{reportYears.map(y => (<SelectItem key={`to-${y}`} value={y}>{y}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                </div>
                 <FormField
                  control={form.control}
                  name="serviceIdForComparison"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Servicio (Opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Todos los Servicios" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={ALL_SERVICES_VALUE}>Todos los Servicios</SelectItem>
                          {services.map(s => <SelectItem key={s.id_servicio} value={s.id_servicio.toString()}>{s.nombre_servicio}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {reportType === 'scheduleQuality' && (
              <>
                <FormField control={form.control} name="serviceIdForScheduleQuality" render={({ field }) => (
                  <FormItem> <FormLabel>Servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Servicio" /></SelectTrigger></FormControl>
                      <SelectContent>{services.map(s => (<SelectItem key={`sq-${s.id_servicio}`} value={s.id_servicio.toString()}>{s.nombre_servicio}</SelectItem>))}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="monthForScheduleQuality" render={({ field }) => (
                    <FormItem> <FormLabel>Mes</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger></FormControl>
                        <SelectContent>{reportMonths.map(m => (<SelectItem key={`sq-${m.value}`} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="yearForScheduleQuality" render={({ field }) => (
                    <FormItem> <FormLabel>Año</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Año" /></SelectTrigger></FormControl>
                        <SelectContent>{reportYears.map(y => (<SelectItem key={`sq-${y}`} value={y}>{y}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                </div>
              </>
            )}

            {reportType === 'scheduleComparison' && (
              <>
                <FormField control={form.control} name="serviceIdForComparison" render={({ field }) => (
                  <FormItem> <FormLabel>Servicio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Servicio" /></SelectTrigger></FormControl>
                      <SelectContent>{services.map(s => (<SelectItem key={`sc-${s.id_servicio}`} value={s.id_servicio.toString()}>{s.nombre_servicio}</SelectItem>))}</SelectContent>
                    </Select><FormMessage />
                  </FormItem>)} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="monthFrom" render={({ field }) => (
                    <FormItem> <FormLabel>Mes Desde</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Mes Desde" /></SelectTrigger></FormControl>
                        <SelectContent>{reportMonths.map(m => (<SelectItem key={`sc-from-${m.value}`} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="yearFrom" render={({ field }) => (
                    <FormItem> <FormLabel>Año Desde</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Año Desde" /></SelectTrigger></FormControl>
                        <SelectContent>{reportYears.map(y => (<SelectItem key={`sc-from-${y}`} value={y}>{y}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="monthTo" render={({ field }) => (
                    <FormItem> <FormLabel>Mes Hasta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Mes Hasta" /></SelectTrigger></FormControl>
                        <SelectContent>{reportMonths.map(m => (<SelectItem key={`sc-to-${m.value}`} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                  <FormField control={form.control} name="yearTo" render={({ field }) => (
                    <FormItem> <FormLabel>Año Hasta</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Año Hasta" /></SelectTrigger></FormControl>
                        <SelectContent>{reportYears.map(y => (<SelectItem key={`sc-to-${y}`} value={y}>{y}</SelectItem>))}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>)} />
                </div>
              </>
            )}

          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
                (reportType === 'employeeComparison' ? <Users className="mr-2 h-4 w-4" /> : 
                (reportType === 'scheduleQuality' ? <CheckCircle className="mr-2 h-4 w-4" /> : 
                <BarChartBig className="mr-2 h-4 w-4" />))}
              Generar Informe
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
