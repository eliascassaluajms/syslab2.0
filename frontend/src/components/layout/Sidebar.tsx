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
// CONFIGURACIÓN CENTRALIZADA Y COMPLETA DEL MENÚ
// ==========================================
const menuConfig: MenuItem[] = [
  {
    id: 'organica',
    titulo: 'Estructura Orgánica',
    icono: '🏢',
    subItems: [
      {
        titulo: 'Facultades y Carreras',
        ruta: '/admin/catalogos',
        icono: '🏛️',
        permiso: ['facultades:listar', 'carreras:listar'],
      },
      {
        titulo: 'Planes y Materias',
        ruta: '/admin/planes-materias',
        icono: '📋',
        permiso: ['planes_estudio:listar', 'materias:listar'],
      },
      {
        titulo: 'Horarios y Cronograma',
        ruta: '/admin/horarios',
        icono: '📅',
        permiso: 'horarios:listar',
      },
    ],
  },
  {
    id: 'laboratorios',
    titulo: 'Gestión de Laboratorios',
    icono: '🔬',
    subItems: [
      {
        titulo: 'Laboratorios Físicos',
        ruta: '/admin/laboratorios',
        icono: '🔬',
        permiso: 'laboratorios:listar',
      },
      {
        titulo: 'Inventario de Equipos',
        ruta: '/admin/equipos',
        icono: '💻',
        permiso: 'equipos:listar',
      },
      {
        titulo: 'Bitácora de Uso',
        ruta: '/admin/uso-laboratorios',
        icono: '📖',
        permiso: 'uso_laboratorios:listar',
      },
      {
        titulo: 'Gestión de Incidencias',
        ruta: '/admin/fallas',
        icono: '⚠️',
        permiso: 'fallas:listar',
      },
    ],
  },
  {
    id: 'actividades',
    titulo: 'Eventos y Actividades',
    icono: '🎓',
    subItems: [
      {
        titulo: 'Categorías de Eventos',
        ruta: '/admin/actividades/categorias',
        icono: '🏷️',
        permiso: 'actividades:categorias_listar',
      },
      {
        titulo: 'Actividades Académicas',
        ruta: '/admin/actividades',
        icono: '🎪',
        permiso: 'actividades:listar',
      },
      {
        titulo: 'Inscritos y Participantes',
        ruta: '/admin/actividades/participantes',
        icono: '👥',
        permiso: 'actividades:participantes_listar',
      },
      {
        titulo: 'Validación de Pagos',
        ruta: '/admin/actividades/pagos',
        icono: '💳',
        permiso: ['actividades:pagos_registrar', 'actividades:pagos_validar'],
      },
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Control de Acceso',
    icono: '🛡️',
    subItems: [
      {
        titulo: 'Gestión de Usuarios',
        ruta: '/admin/usuarios',
        icono: '👥',
        permiso: 'usuarios:listar',
      },
      {
        titulo: 'Roles y Permisos',
        ruta: '/admin/roles',
        icono: '🔑',
        permiso: 'roles:listar',
      },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { user, tienePermiso, logout } = useAuth();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});

  const esAdmin =
    user?.rol === 'Administrador' ||
    (typeof user?.rol === 'object' && (user.rol as any)?.nombre === 'Administrador');

  // Evalúa permisos granulares o bypass para administrador
  const evaluarPermiso = (permisoReq?: string | string[]): boolean => {
    if (!permisoReq) return true;
    if (esAdmin) return true;

    if (Array.isArray(permisoReq)) {
      return permisoReq.some((p) => {
        if (typeof tienePermiso === 'function') return tienePermiso(p);
        return Array.isArray(user?.permisos) && user.permisos.includes(p);
      });
    }

    if (typeof tienePermiso === 'function') return tienePermiso(permisoReq);
    return Array.isArray(user?.permisos) && user.permisos.includes(permisoReq);
  };

  // Filtrado recursivo del menú según permisos asignados
  const menuFiltrado = menuConfig
    .map((item) => {
      if (!item.subItems) {
        return evaluarPermiso(item.permiso) ? item : null;
      }

      const subItemsVisibles = item.subItems.filter((sub) => evaluarPermiso(sub.permiso));

      if (subItemsVisibles.length > 0) {
        return {
          ...item,
          subItems: subItemsVisibles,
        };
      }

      return null;
    })
    .filter((item): item is MenuItem => item !== null);

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

  let nombreRol = 'Personal';
  if (typeof user?.rol === 'string') {
    nombreRol = user.rol;
  } else if (user?.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
    nombreRol = (user.rol as { nombre: string }).nombre;
  }

  // Cálculo descriptivo del ámbito / perímetro asignado
  const numFacultades = Array.isArray(user?.facultades) ? user.facultades.length : 0;
  const numCarreras = Array.isArray(user?.carreras) ? user.carreras.length : 0;

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col justify-between h-screen sticky top-0 select-none text-slate-200">
      <div>
        {/* Cabecera Institucional */}
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
        <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-220px)]">
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
                      <button
                        onClick={() => toggleSubmenu(item.id)}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-gray-800/60 text-gray-300"
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

      {/* Sección Inferior: Ámbito/Perímetro y Perfil de Usuario */}
      <div className="p-4 border-t border-gray-800 bg-gray-950/60 space-y-3">
        {/* Widget de Ámbito / Perímetro */}
        <div className="px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-gray-400 font-medium">
            <span>📍 Ámbito Asignado:</span>
          </div>
          {esAdmin ? (
            <span className="text-emerald-400 font-semibold block truncate">🌐 Global (Sin restricción)</span>
          ) : (
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-[10px]">
              <span>🏛️ {numFacultades} Fac.</span>
              <span>•</span>
              <span>🎓 {numCarreras} Carr.</span>
            </div>
          )}
        </div>

        {/* Perfil del Usuario Autenticado */}
        <div className="flex items-center justify-between pt-1">
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
