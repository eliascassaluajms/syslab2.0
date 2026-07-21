import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Sidebar Fijo a la Izquierda */}
      <Sidebar />

      {/* Panel de Contenido Dinámico a la Derecha */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};