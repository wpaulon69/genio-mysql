"use client";

import React, { useState } from 'react';
import PageHeader from '@/components/common/page-header';
import ReportFilters from '@/components/reports/report-filters';
import ReportDisplay from '@/components/reports/report-display';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from 'lucide-react';
import type { Service, Employee, Holiday, EmployeeComparisonReportOutput, ScheduleQualityReportOutput, ScheduleComparisonReportOutput } from '@/lib/types';

interface ReportsClientProps {
  services: Service[];
  employees: Employee[];
  holidays: Holiday[];
}

const reportMonths = Array.from({ length: 12 }, (_, i) => ({
  value: (i + 1).toString(),
  label: new Date(2000, i).toLocaleString('es-ES', { month: 'long' }),
}));

const ALL_SERVICES_VALUE_CONST = "__ALL_SERVICES_COMPARISON__";

export default function ReportsClient({ services, employees, holidays }: ReportsClientProps) {
  const [employeeComparisonOutput, setEmployeeComparisonOutput] = useState<EmployeeComparisonReportOutput | null>(null);
  const [scheduleQualityOutput, setScheduleQualityOutput] = useState<ScheduleQualityReportOutput | null>(null);
  const [scheduleComparisonOutput, setScheduleComparisonOutput] = useState<ScheduleComparisonReportOutput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const handleGenerateReport = async (filters: any) => {
    setIsProcessing(true);
    setProcessingError(null);
    setEmployeeComparisonOutput(null);
    setScheduleQualityOutput(null);
    setScheduleComparisonOutput(null);

    if (filters.reportType === 'employeeComparison') {
      try {
        const { monthFrom, yearFrom, monthTo, yearTo, serviceIdForComparison } = filters;
        if (!monthFrom || !yearFrom || !monthTo || !yearTo) {
          setProcessingError("Faltan parámetros de fecha para el informe comparativo.");
          return;
        }
        const targetServiceId = (serviceIdForComparison === ALL_SERVICES_VALUE_CONST || !serviceIdForComparison) ? '' : serviceIdForComparison;
        const url = `/api/reports/employee-comparison?yearFrom=${yearFrom}&monthFrom=${monthFrom}&yearTo=${yearTo}&monthTo=${monthTo}&serviceId=${targetServiceId}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener el informe de comparación de empleados.');
        }
        const reportDataArray = await response.json();
        const dateFromLabel = `${reportMonths.find(m => m.value === monthFrom)?.label} ${yearFrom}`;
        const dateToLabel = `${reportMonths.find(m => m.value === monthTo)?.label} ${yearTo}`;
        let serviceNameForLabel = "Todos los Servicios";
        if (targetServiceId) {
            const foundService = services.find(s => s.id_servicio.toString() === targetServiceId);
            if (foundService) serviceNameForLabel = foundService.nombre_servicio;
        }
        setEmployeeComparisonOutput({
            reportType: 'employeeComparison',
            data: reportDataArray,
            dateRangeLabel: `${dateFromLabel} - ${dateToLabel}`,
            serviceNameLabel: serviceNameForLabel
        });
      } catch (e) {
        console.error("Error generando el informe comparativo de empleados:", e);
        setProcessingError(e instanceof Error ? e.message : "Ocurrió un error desconocido durante la generación del informe.");
      }
    } else if (filters.reportType === 'scheduleQuality') {
      try {
        const { serviceIdForScheduleQuality, monthForScheduleQuality, yearForScheduleQuality } = filters;
        if (!serviceIdForScheduleQuality || !monthForScheduleQuality || !yearForScheduleQuality) {
          setProcessingError("Faltan parámetros de servicio, mes o año para el informe de calidad de horario.");
          return;
        }
        const url = `/api/reports/schedule-quality?year=${yearForScheduleQuality}&month=${monthForScheduleQuality}&serviceId=${serviceIdForScheduleQuality}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener el informe de calidad.');
        }
        const publishedSchedule = await response.json();
        const service = services.find(s => s.id_servicio.toString() === serviceIdForScheduleQuality);
        const monthLabel = reportMonths.find(m => m.value === monthForScheduleQuality)?.label || monthForScheduleQuality;
        setScheduleQualityOutput({
          reportType: 'scheduleQuality',
          scheduleKey: publishedSchedule.scheduleKey,
          serviceName: service?.nombre_servicio || 'Servicio Desconocido',
          dateLabel: `${monthLabel} ${yearForScheduleQuality}`,
          score: publishedSchedule.score,
          violations: publishedSchedule.violations,
          scoreBreakdown: publishedSchedule.scoreBreakdown,
        });
      } catch (e) {
        console.error("Error generando el informe de calidad de horario:", e);
        setProcessingError(e instanceof Error ? e.message : "Ocurrió un error desconocido durante la generación del informe de calidad.");
      }
    } else if (filters.reportType === 'scheduleComparison') {
      try {
        const { monthFrom, yearFrom, monthTo, yearTo, serviceIdForComparison } = filters;
        if (!monthFrom || !yearFrom || !monthTo || !yearTo || !serviceIdForComparison) {
          setProcessingError("Faltan parámetros para el informe comparativo de horarios.");
          return;
        }
        const url = `/api/reports/schedule-comparison?yearFrom=${yearFrom}&monthFrom=${monthFrom}&yearTo=${yearTo}&monthTo=${monthTo}&serviceId=${serviceIdForComparison}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener el informe comparativo.');
        }
        const comparisonData = await response.json();
        const dateFromLabel = `${reportMonths.find(m => m.value === monthFrom)?.label} ${yearFrom}`;
        const dateToLabel = `${reportMonths.find(m => m.value === monthTo)?.label} ${yearTo}`;
        const service = services.find(s => s.id_servicio.toString() === serviceIdForComparison);
        setScheduleComparisonOutput({
            reportType: 'scheduleComparison',
            data: comparisonData,
            dateRangeLabel: `${dateFromLabel} - ${dateToLabel}`,
            serviceNameLabel: service?.nombre_servicio || 'Servicio Desconocido',
        });
      } catch (e) {
        console.error("Error generando el informe comparativo de horarios:", e);
        setProcessingError(e instanceof Error ? e.message : "Ocurrió un error desconocido durante la generación del informe.");
      }
    } else {
      setProcessingError(`El tipo de informe '${filters.reportType}' aún no está implementado.`);
    }
    setIsProcessing(false);
  };

  return (
    <>
      <PageHeader
        title="Informes y Analíticas"
        description="Genere informes de utilización y obtenga resúmenes impulsados por IA o análisis comparativos de horarios publicados."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <ReportFilters 
            onGenerateReport={handleGenerateReport} 
            isLoading={isProcessing}
            services={services}
            employees={employees} 
          />
        </div>
        <div className="md:col-span-2">
          {isProcessing && (
            <Alert>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <AlertTitle>Procesando Informe...</AlertTitle>
              <AlertDescription>Por favor espere mientras se genera su informe.</AlertDescription>
            </Alert>
          )}
          {processingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{processingError}</AlertDescription>
            </Alert>
          )}
          
          <ReportDisplay 
            employeeComparisonOutput={employeeComparisonOutput}
            scheduleQualityOutput={scheduleQualityOutput}
            scheduleComparisonOutput={scheduleComparisonOutput}
          />

          {!isProcessing && !processingError && !employeeComparisonOutput && !scheduleQualityOutput && !scheduleComparisonOutput && (
             <Alert>
              <AlertTitle>Ningún Informe Generado</AlertTitle>
              <AlertDescription>Seleccione el tipo de informe y los parámetros, luego haga clic en &apos;Generar Informe&apos;.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </>
  );
}
