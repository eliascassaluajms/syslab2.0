import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

// ==========================================
// INTERFACES DEL MENÚ CON SOPORTE DE SUBMENÚS
// ==========================================
interface SubMenuItem {
  titulo: string;
  ruta: string;
  icono?: string;
  permiso?: string | string[];
}

interface MenuItem {
  id: string;
  titulo: string;
  icono: string;
  ruta?: string;
  permiso?: string | string[];
  subItems?: SubMenuItem[];
}

// ==========================================
// CONFIGURACIÓN CENTRALIZADA DEL MENÚ
// ==========================================
const menuConfig: MenuItem[] = [
  {
    id: 'catalogos',
    titulo: 'Estructura Orgánica',
    icono: '🏢',
    subItems: [
      {
        titulo: 'Facultades y Carreras',
        ruta: '/admin/catalogos',
        icono: '🏛️',
        permiso: ['facultades:listar', 'carreras:listar'],
      },
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Control de Acceso',
    icono: '🛡️',
    subItems: [
      {
        titulo: 'Roles y Permisos',
        ruta: '/admin/roles',
        icono: '🔑',
        permiso: 'roles:listar',
      },
      {
        titulo: 'Gestión de Usuarios',
        ruta: '/admin/usuarios',
        icono: '👥',
        permiso: 'usuarios:listar',
      },
    ],
  },
  {
    id: 'laboratorios',
    titulo: 'Gestión de Laboratorios',
    icono: '🔬',
    ruta: '/admin/laboratorios',
    permiso: 'laboratorios:listar',
    // Si en el futuro agregas subpáginas como 'Equipos' o 'Mantenimientos', puedes convertirlos en subItems aquí.
  },
];

export const Sidebar: React.FC = () => {
  const { user, tienePermiso, logout } = useAuth();
  const location = useLocation();

  // Estado para controlar qué submenús están desplegados
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const esAdmin = user?.rol === 'Administrador' || (typeof user?.rol === 'object' && (user.rol as any)?.nombre === 'Administrador');

  // Helper para verificar si un usuario tiene acceso a un permiso individual o arreglo de permisos
  const evaluarPermiso = (permisoReq?: string | string[]): boolean => {
    if (!permisoReq) return true; // Si no requiere permiso, es público
    if (esAdmin) return true; // Bypass absoluto para Administrador

    if (Array.isArray(permisoReq)) {
      // Retorna true si tiene AL MENOS UNO de los permisos solicitados
      return permisoReq.some((p) => {
        if (typeof tienePermiso === 'function') return tienePermiso(p);
        return Array.isArray(user?.permisos) && user.permisos.includes(p);
      });
    }

    if (typeof tienePermiso === 'function') return tienePermiso(permisoReq);
    return Array.isArray(user?.permisos) && user.permisos.includes(permisoReq);
  };

  // 🔍 Filtrado dinámico recursivo del menú
  const menuFiltrado = menuConfig
    .map((item) => {
      // 1. Si es un menú simple (sin submenú)
      if (!item.subItems) {
        const visible = evaluarPermiso(item.permiso);
        return visible ? item : null;
      }

      // 2. Si tiene submenús, filtrar sus subItems de forma granular
      const subItemsVisibles = item.subItems.filter((sub) => evaluarPermiso(sub.permiso));

      // Si le quedan sub-ítems visibles, conservar la categoría
      if (subItemsVisibles.length > 0) {
        return {
          ...item,
          subItems: subItemsVisibles,
        };
      }

      return null;
    })
    .filter((item): item is MenuItem => item !== null);

  // Auto-expandir el submenú correspondiente si la ruta actual coincide con un sub-ítem
  useEffect(() => {
    const newOpenState: Record<string, boolean> = { ...openSubmenus };
    menuFiltrado.forEach((item) => {
      if (item.subItems) {
        const activeSub = item.subItems.some((sub) => location.pathname.startsWith(sub.ruta));
        if (activeSub) {
          newOpenState[item.id] = true;
        }
      }
    });
    setOpenSubmenus(newOpenState);
  }, [location.pathname]);

  const toggleSubmenu = (id: string) => {
    setOpenSubmenus((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Lectura del rol institucional
  let nombreRol = 'Personal';
  if (typeof user?.rol === 'string') {
    nombreRol = user.rol;
  } else if (user?.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
    nombreRol = (user.rol as { nombre: string }).nombre;
  }

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0 select-none text-slate-200">
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

        {/* Navegación Principal Dinámica */}
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)]">
          <div>
            <p className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-3">
              Menú Principal
            </p>
            <ul className="space-y-1.5">
              {menuFiltrado.map((item) => {
                const isOpen = !!openSubmenus[item.id];
                const hasSubItems = item.subItems && item.subItems.length > 0;

                if (hasSubItems) {
                  return (
                    <li key={item.id} className="space-y-1">
                      {/* Botón Encabezado de Categoria / Desplegable */}
                      <button
                        onClick={() => toggleSubmenu(item.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-gray-800/60 text-gray-300`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{item.icono}</span>
                          <span>{item.titulo}</span>
                        </div>
                        <svg
                          className={`w-3.5 h-3.5 transition-transform duration-200 text-gray-400 ${
                            isOpen ? 'rotate-180 text-blue-400' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {/* Sub-ítems Colapsables */}
                      {isOpen && (
                        <ul className="pl-4 space-y-1 border-l border-gray-800 ml-4 py-1">
                          {item.subItems!.map((sub) => (
                            <li key={sub.ruta}>
                              <NavLink
                                to={sub.ruta}
                                className={({ isActive }) =>
                                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                    isActive
                                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/20 font-semibold'
                                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                                  }`
                                }
                              >
                                {sub.icono && <span className="text-xs">{sub.icono}</span>}
                                <span>{sub.titulo}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }

                // Opción Simple sin submenú
                return (
                  <li key={item.ruta || item.id}>
                    <NavLink
                      to={item.ruta!}
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
                );
              })}
            </ul>
          </div>
        </nav>
      </div>

      {/* Perfil del Usuario Autenticado y Logout */}
      <div className="p-4 border-t border-gray-800 bg-gray-950/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400 text-xs font-bold">
              {user?.nombre?.substring(0, 2).toUpperCase() || 'US'}
            </div>
            <div className="overflow-hidden max-w-[120px]">
              <p className="text-xs font-semibold text-white truncate" title={user?.nombre}>
                {user?.nombre || 'Usuario'}
              </p>
              <p className="text-[10px] text-gray-400 truncate" title={nombreRol}>
                {nombreRol}
              </p>
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