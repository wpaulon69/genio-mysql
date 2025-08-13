
"use client";

import React from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import PageHeader from '@/components/common/page-header';
import ServiceEmployeeViewer from '@/components/overview/ServiceEmployeeViewer';
import SimpleLogoutButton from '@/components/auth/SimpleLogoutButton';
import { PERMISSIONS } from '@/lib/auth/permissions';

export default function ServiceOverviewPage() {
  return (
    <ProtectedRoute permission={PERMISSIONS.VIEW_ALL_EMPLOYEES}>
      <div className="container mx-auto">
        <div className="flex justify-between items-start mb-6">
          <PageHeader
            title="Personal por Servicio"
            description="Seleccione un servicio para ver los empleados asignados y sus roles."
          />
          <SimpleLogoutButton />
        </div>
        <ServiceEmployeeViewer />
      </div>
    </ProtectedRoute>
  );
}
