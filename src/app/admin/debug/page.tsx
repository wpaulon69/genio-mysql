'use client';

import { useState } from 'react';
import UserFormDebug from '@/components/admin/UserFormDebug';

export default function DebugPage() {
  const [showForm, setShowForm] = useState(true);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Admin Form</h1>
      
      {showForm && (
        <UserFormDebug onSuccess={() => setShowForm(false)} />
      )}
      
      {!showForm && (
        <div className="p-4 bg-green-100 rounded">
          <p>Form closed successfully!</p>
          <button 
            onClick={() => setShowForm(true)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Show Form Again
          </button>
        </div>
      )}
    </div>
  );
}