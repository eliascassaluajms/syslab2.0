import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '../components/layout/Sidebar';

export const DashboardLayout: React.FC = () => {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-[#071522] text-gray-100 font-sans md:flex">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-sky-500/20 bg-[#0a1628]/95 px-4 backdrop-blur-md md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-400/40 bg-sky-500/15 text-xs font-black text-sky-300">
            SL
          </div>
          <span className="text-sm font-bold tracking-tight text-sky-100">SysLab 2.0</span>
        </div>
        <button
          type="button"
          onClick={() => setSidebarAbierto((abierto) => !abierto)}
          className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-2 text-sky-300 transition-colors hover:bg-sky-500/20"
          aria-label={sidebarAbierto ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={sidebarAbierto}
        >
          {sidebarAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {sidebarAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarAbierto(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:static md:shrink-0 md:translate-x-0 ${
          sidebarAbierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseMobile={() => setSidebarAbierto(false)} />
      </div>

      {/* Panel de Contenido Dinámico a la Derecha */}
      <main className="min-w-0 flex-1 overflow-y-auto pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};