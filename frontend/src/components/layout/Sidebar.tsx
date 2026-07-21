import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  titulo: string;
  ruta: string;
  icono: string;
  permiso?: string;
}

// 🟢 Configuración centralizada y dinámica de los ítems del menú
const menuConfig: MenuItem[] = [
  {
    titulo: 'Facultades y Carreras',
    ruta: '/admin/catalogos',
    icono: '🏢',
    permiso: 'catalogos:gestionar',
  },
  {
    titulo: 'Roles y Permisos',
    ruta: '/admin/roles',
    icono: '🛡️',
    permiso: 'roles:gestionar',
  },
  {
    titulo: 'Gestión de Usuarios',
    ruta: '/admin/usuarios',
    icono: '👥',
    permiso: 'usuarios:gestionar',
  },
  {
    titulo: 'Gestión de Laboratorios',
    ruta: '/admin/laboratorios', // 👈 Sincronizado con AppRoutes.tsx
    icono: '🔬',
    permiso: 'laboratorios:ver',
  },
];

export const Sidebar: React.FC = () => {
  const { user, tienePermiso, logout } = useAuth();

  // 🔍 Filtrado dinámico según la matriz de permisos del usuario autenticado
  const menuFiltrado = menuConfig.filter((item) => {
    if (!item.permiso) return true;
    return tienePermiso(item.permiso);
  });

  // 👤 Lectura segura del rol institucional para mostrar en el perfil
  let nombreRol = 'Personal';
  if (typeof user?.rol === 'string') {
    nombreRol = user.rol;
  } else if (user?.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
    nombreRol = (user.rol as { nombre: string }).nombre;
  }

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0 select-none">
      <div>
        {/* Logotipo / Cabecera Institucional */}
        <div className="p-6 border-b border-gray-800/80 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shadow-lg shadow-blue-500/10">
            SL
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">SysLab 2.0</h2>
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">UAJMS - Yacuiba</p>
          </div>
        </div>

        {/* Menú Dinámico con React Router NavLink */}
        <nav className="p-4 space-y-6">
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
              Menú Principal
            </p>
            <ul className="space-y-1">
              {menuFiltrado.map((item) => (
                <li key={item.ruta}>
                  <NavLink
                    to={item.ruta}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-md shadow-blue-600/10'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                      }`
                    }
                  >
                    <span className="text-base">{item.icono}</span>
                    <span>{item.titulo}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </div>

      {/* Tarjeta Inferior de Perfil de Usuario y Logout */}
      <div className="p-4 border-t border-gray-800 bg-gray-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold">
              {user?.nombre?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden max-w-[110px]">
              <p className="text-xs font-semibold text-white truncate">{user?.nombre || 'Usuario'}</p>
              <p className="text-[10px] text-gray-400 truncate">{nombreRol}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Cerrar Sesión"
            className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            🚪
          </button>
        </div>
      </div>
    </aside>
  );
};