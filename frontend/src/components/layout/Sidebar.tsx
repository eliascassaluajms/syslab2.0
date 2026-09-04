import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ModalCambiarPasswordPersonal } from '../usuario/ModalCambiarPasswordPersonal';

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

interface SidebarProps {
  onCloseMobile?: () => void;
}

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
        titulo: 'Inventario de Bienes',
        ruta: '/admin/inventario',
        icono: '📦',
        permiso: 'equipos:listar',
      },
      {
        titulo: 'Bitácora de Uso',
        ruta: '/admin/bitacoras',
        icono: '📋',
        permiso: ['uso_laboratorios:listar', 'bitacora:consultar'],
      },
      {
        titulo: 'Horarios Extraordinarios',
        ruta: '/admin/solicitudes-extraordinarias',
        icono: '⏱️',
        permiso: ['solicitudes:listar', 'solicitudes:crear'],
      },
      {
        titulo: 'Incidencias y Fallas',
        ruta: '/admin/incidencias',
        icono: '⚠️',
        permiso: ['fallas:listar', 'incidencias:listar'],
      },
    ],
  },
  {
    id: 'defensas',
    titulo: 'Titulación y Defensas',
    icono: '🎓',
    subItems: [
      {
        titulo: 'Defensas de Grado',
        ruta: '/admin/defensas',
        icono: '🧾',
        permiso: ['defensas:listar', 'defensas:crear', 'defensas:designar', 'defensas:observar', 'defensas:acta'],
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
        ruta: '/admin/actividades/gestion',
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
        titulo: 'Mi Perfil',
        ruta: '/admin/perfil',
        icono: '👤',
      },
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

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, tienePermiso, logout } = useAuth();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const [mostrarModalPassword, setMostrarModalPassword] = useState(false);

  const esAdmin =
    user?.rol === 'Administrador' ||
    (typeof user?.rol === 'object' && (user.rol as any)?.nombre === 'Administrador');

  const usuarioAny = user as any;
  const listaAsignaciones = 
    usuarioAny?.asignacionesAmbito || 
    usuarioAny?.asignacionesRoles || 
    usuarioAny?.asignaciones || 
    usuarioAny?.ambitos || 
    usuarioAny?.rolesUsuario || 
    [];

  const asignacionesArray = Array.isArray(listaAsignaciones) 
    ? listaAsignaciones 
    : (listaAsignaciones ? [listaAsignaciones] : []);

  const [ambitoActivoId, setAmbitoActivoId] = useState<string | number>(() => {
    return localStorage.getItem('syslab_ambito_activo') || (asignacionesArray[0]?.id ?? '');
  });

  const asignacionActiva = asignacionesArray.find(
    (asig: any, index: number) => String(asig.id || asig.codigo || index) === String(ambitoActivoId)
  );

  const rolActivoNombre = asignacionActiva?.rol?.nombre || asignacionActiva?.rol || '';

  const handleCambiarAmbito = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nuevoId = e.target.value;
    setAmbitoActivoId(nuevoId);
    localStorage.setItem('syslab_ambito_activo', nuevoId);
    window.location.reload();
  };

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

  const handleNavegar = () => onCloseMobile?.();

  let nombreRol = 'Personal';
  if (typeof user?.rol === 'string') {
    nombreRol = user.rol;
  } else if (user?.rol && typeof user.rol === 'object' && 'nombre' in user.rol) {
    nombreRol = (user.rol as { nombre: string }).nombre;
  }

  return (
    <>
      <aside className="h-full w-full bg-[#0a1628] border-r border-sky-500/20 flex flex-col justify-between select-none text-slate-200 md:sticky md:top-0 md:h-screen">
        <div>
          <div className="p-6 border-b border-gray-800/80 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg shadow-lg shadow-blue-500/10">
              SL
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">SysLab 2.0</h2>
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">UAJMS - Yacuiba</p>
            </div>
          </div>

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
                          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-gray-800/60 text-gray-300 cursor-pointer"
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
                                  onClick={handleNavegar}
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
                        onClick={handleNavegar}
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

        <div className="p-4 border-t border-gray-800 bg-gray-950/60 space-y-3">
          <div className="px-3 py-2 rounded-xl bg-gray-900/80 border border-gray-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-gray-400 font-medium">
              <span>📍 Ámbito / Rol Activo:</span>
            </div>
            {esAdmin ? (
              <span className="text-emerald-400 font-semibold block truncate">🌐 Administrador Global</span>
            ) : asignacionesArray.length > 0 ? (
              <select
                value={ambitoActivoId}
                onChange={handleCambiarAmbito}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-[10px] text-blue-400 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {asignacionesArray.map((asig: any, index: number) => (
                  <option key={asig.id || asig.codigo || index} value={asig.id || asig.codigo || index}>
                    {asig.rol?.nombre || asig.rol || asig.nombreAmbito || 'Rol'} - {asig.carrera?.nombre || asig.facultad?.nombre || asig.nombre || 'General'}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-amber-400 font-semibold block truncate">⚠️ Sin ámbitos asignados</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-1">
            <NavLink to="/admin/perfil" onClick={handleNavegar} className="flex items-center gap-3 overflow-hidden group">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex-shrink-0 flex items-center justify-center text-blue-400 text-xs font-bold group-hover:border-blue-400 transition-colors">
                {user?.nombre?.substring(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="overflow-hidden max-w-[100px]">
                <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400 transition-colors" title={user?.nombre}>
                  {user?.nombre || 'Usuario'}
                </p>
                <p className="text-[10px] text-gray-400 truncate" title={rolActivoNombre || nombreRol}>
                  {rolActivoNombre || nombreRol}
                </p>
              </div>
            </NavLink>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMostrarModalPassword(true)}
                title="Cambiar Mi Contraseña"
                className="text-gray-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
              >
                🔒
              </button>
              <button
                onClick={logout}
                title="Cerrar Sesión"
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </aside>

      <ModalCambiarPasswordPersonal
        modalAbierto={mostrarModalPassword}
        onClose={() => setMostrarModalPassword(false)}
      />
    </>
  );
};
