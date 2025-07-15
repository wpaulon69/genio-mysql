import React from 'react';
import { getServices } from '@/lib/mysql/services';
import { getEmployees } from '@/lib/mysql/employees';
import { getHolidays } from '@/lib/mysql/holidays';
import ReportsClient from '@/components/reports/ReportsClient';
import { Loader2 } from 'lucide-react';

export default async function ReportsPage() {
  // Fetch initial data on the server
  const services = await getServices();
  const employees = await getEmployees();
  const holidays = await getHolidays();

  return (
    <div className="container mx-auto">
      <ReportsClient
        services={services}
        employees={employees}
        holidays={holidays}
      />
    </div>
  );
}
