import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ModalCambiarPasswordPersonal } from '../components/usuario/ModalCambiarPasswordPersonal';

export const PerfilView: React.FC = () => {
  const { user } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);

  const nombreCompleto = [user?.nombre, (user as any)?.apellido].filter(Boolean).join(' ') || 'Usuario';
  const username = (user as any)?.username;
  const correo = user?.correo;
  const roles = user?.roles || (user?.rol ? [user.rol] : []);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 text-slate-100">
      {/* Encabezado Principal */}
      <div className="border-b border-gray-800 pb-5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span className="text-blue-500">👤</span> Mi Perfil de Usuario
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Información personal de identidad, credenciales y roles asignados en SysLab 2.0
        </p>
      </div>

      {/* Tarjeta Principal de Perfil */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Cabecera con Avatar */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b border-gray-800 pb-6">
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border-2 border-blue-400/30 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-blue-600/20">
            {nombreCompleto.substring(0, 2).toUpperCase()}
          </div>
          <div className="space-y-1 text-center sm:text-left flex-1">
            <h2 className="text-xl font-bold text-white">{nombreCompleto}</h2>
            {username && (
              <div className="inline-block">
                <span className="px-3 py-1 text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
                  @{username}
                </span>
              </div>
            )}
            <p className="text-xs text-gray-400 font-mono pt-1">{correo}</p>
          </div>

          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer border border-blue-500/30"
          >
            <span>🔒</span> Cambiar Mi Contraseña
          </button>
        </div>

        {/* Detalles de la Cuenta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
              Correo Institucional
            </span>
            <span className="text-sm font-medium text-gray-200 font-mono">{correo || 'No especificado'}</span>
          </div>

          <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-1">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
              Nombre de Usuario (Nick)
            </span>
            <span className="text-sm font-medium text-blue-400 font-mono">
              {username ? `@${username}` : 'No generado'}
            </span>
          </div>

          <div className="p-4 bg-gray-950/60 border border-gray-800/80 rounded-xl space-y-2 md:col-span-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
              Roles y Permisos Asignados
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {roles.length > 0 ? (
                roles.map((r: any, idx: number) => {
                  const rolNombre = typeof r === 'string' ? r : r.nombre;
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      🛡️ {rolNombre}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs italic text-gray-500">Sin roles asignados</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cambio de contraseña */}
      <ModalCambiarPasswordPersonal
        modalAbierto={modalAbierto}
        onClose={() => setModalAbierto(false)}
      />
    </div>
  );
};
