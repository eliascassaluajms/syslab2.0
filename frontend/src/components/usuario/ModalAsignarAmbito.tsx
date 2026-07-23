import React, { useState, useEffect } from 'react';
import { httpClient as api } from '../../services/httpClient';
import { UsuarioLista } from '../../interfaces/usuario';

interface RolSimple {
  id: number;
  nombre: string;
}

interface Carrera {
  id: number;
  nombre: string;
  facultadId: number;
}

interface Facultad {
  id: number;
  nombre: string;
  carreras?: Carrera[];
}

interface Props {
  modalAbierto: boolean;
  onClose: () => void;
  usuario: UsuarioLista | null;
  onActualizado: () => void;
}

export const ModalAsignarAmbito: React.FC<Props> = ({ modalAbierto, onClose, usuario, onActualizado }) => {
  const [rolesDisponibles, setRolesDisponibles] = useState<RolSimple[]>([]);
  const [facultadesDisponibles, setFacultadesDisponibles] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Estados del formulario y ámbito
  const [rolesSeleccionados, setRolesSeleccionados] = useState<number[]>([]);
  const [tipoAmbito, setTipoAmbito] = useState<'institucional' | 'facultad' | 'carrera'>('institucional');
  const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState<number[]>([]);
  const [carreraSeleccionadaId, setCarreraSeleccionadaId] = useState<number | null>(null);

  // Cargar roles, facultades y carreras de forma unificada desde la BD al abrir el modal
  useEffect(() => {
    if (!modalAbierto || !usuario) return;

    const cargarDatosBD = async () => {
      setLoading(true);
      setError(null);
      try {
        // Petición paralela de roles, facultades y carreras para asegurar la relación completa
        const [resRoles, resFacultades, resCarreras] = await Promise.all([
          api.get('/roles'),
          api.get('/catalogos/facultades'),
          api.get('/catalogos/carreras').catch(() => ({ data: [] }))
        ]);

        const rolesList = resRoles.data?.data || resRoles.data || [];
        const facsList = resFacultades.data?.data || resFacultades.data || [];
        const carsList = resCarreras.data?.data || resCarreras.data || [];

        // Vincular las carreras a su respectiva facultad si no vienen anidadas del backend
        const facultadesMapeadas = facsList.map((fac: Facultad) => ({
          ...fac,
          carreras: fac.carreras || carsList.filter((car: Carrera) => car.facultadId === fac.id || (car as any).facultad_id === fac.id)
        }));

        setRolesDisponibles(rolesList);
        setFacultadesDisponibles(facultadesMapeadas);

        // Inicializar selecciones según el usuario actual
        const rolesIds = usuario.roles?.map(r => r.id) || (usuario.rol ? [usuario.rol.id] : []);
        setRolesSeleccionados(rolesIds);

        const facs = usuario.usuarioFacultades?.map(f => f.facultadId) || usuario.facultades || [];
        const cars = usuario.usuarioCarreras?.map(c => c.carreraId) || usuario.carreras || [];

        setFacultadesSeleccionadas(facs);
        setCarreraSeleccionadaId(cars.length > 0 ? cars[0] : null);

        if (cars.length > 0) {
          setTipoAmbito('carrera');
        } else if (facs.length > 0) {
          setTipoAmbito('facultad');
        } else {
          setTipoAmbito('institucional');
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al obtener la información institucional.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatosBD();
  }, [modalAbierto, usuario]);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    setGuardando(true);
    setError(null);

    // Payload robusto con múltiples formatos compatibles para asegurar la persistencia en el backend
    const payload = {
      rolIds: rolesSeleccionados,
      roles: rolesSeleccionados,
      rolId: rolesSeleccionados[0] || null,
      facultades: tipoAmbito === 'facultad' ? facultadesSeleccionadas : [],
      carreras: tipoAmbito === 'carrera' && carreraSeleccionadaId ? [carreraSeleccionadaId] : [],
      carreraId: tipoAmbito === 'carrera' ? carreraSeleccionadaId : null,
    };

    try {
      await api.put(`/usuarios/${usuario.id}`, payload);
      onActualizado();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al actualizar la asignación en la base de datos.');
    } finally {
      setGuardando(false);
    }
  };

  if (!modalAbierto || !usuario) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-6 text-white max-h-[90vh] overflow-y-auto">
        
        {/* Encabezado del Modal */}
        <div className="border-b border-gray-800 pb-3 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🛡️</span> Asignar Roles y Ámbito Institucional
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Configure los accesos y perímetros operativos para <span className="text-blue-400 font-semibold">{usuario.nombre}</span>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg font-bold p-1 rounded-lg hover:bg-gray-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Notificación de Error */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[220px] justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-5">
            
            {/* Selección Múltiple de Roles */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                Roles del Usuario (Selección múltiple)
              </label>
              <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                {rolesDisponibles.map((rol) => {
                  const isChecked = rolesSeleccionados.includes(rol.id);
                  return (
                    <label
                      key={rol.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRolesSeleccionados([...rolesSeleccionados, rol.id]);
                          } else {
                            setRolesSeleccionados(rolesSeleccionados.filter((id) => id !== rol.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-sm text-gray-200">{rol.nombre}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Selector de Tipo de Ámbito */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Nivel de Ámbito Institucional
              </label>
              <div className="grid grid-cols-3 gap-2 bg-gray-950 p-1.5 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => {
                    setTipoAmbito('institucional');
                    setFacultadesSeleccionadas([]);
                    setCarreraSeleccionadaId(null);
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    tipoAmbito === 'institucional'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  🌐 Institucional (Global)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoAmbito('facultad');
                    setCarreraSeleccionadaId(null);
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    tipoAmbito === 'facultad'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  🏛️ Por Facultad
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoAmbito('carrera');
                    setFacultadesSeleccionadas([]);
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    tipoAmbito === 'carrera'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  📚 Por Carrera
                </button>
              </div>
            </div>

            {/* Contenido Dinámico según Ámbito */}
            {tipoAmbito === 'institucional' && (
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 text-xs text-blue-300 flex items-center gap-3">
                <span className="text-lg">ℹ️</span>
                <span>El usuario tendrá acceso y privilegios globales en toda la estructura institucional sin restricciones perimetrales.</span>
              </div>
            )}

            {tipoAmbito === 'facultad' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Seleccione las Facultades Autorizadas
                </label>
                <div className="bg-gray-950 border border-gray-800 rounded-xl p-3 max-h-48 overflow-y-auto space-y-2">
                  {facultadesDisponibles.map((fac) => {
                    const isChecked = facultadesSeleccionadas.includes(fac.id);
                    return (
                      <label
                        key={fac.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-900 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFacultadesSeleccionadas([...facultadesSeleccionadas, fac.id]);
                            } else {
                              setFacultadesSeleccionadas(facultadesSeleccionadas.filter((id) => id !== fac.id));
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <span className="text-sm text-gray-200">{fac.nombre}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {tipoAmbito === 'carrera' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Seleccione la Carrera Autorizada (Acceso exclusivo a 1 carrera)
                </label>
                <select
                  value={carreraSeleccionadaId || ''}
                  onChange={(e) => setCarreraSeleccionadaId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Seleccione una carrera...</option>
                  {facultadesDisponibles.map((fac) => (
                    <optgroup key={fac.id} label={fac.nombre}>
                      {fac.carreras && fac.carreras.length > 0 ? (
                        fac.carreras.map((car) => (
                          <option key={car.id} value={car.id}>
                            {car.nombre}
                          </option>
                        ))
                      ) : (
                        <option disabled value="">Sin carreras registradas</option>
                      )}
                    </optgroup>
                  ))}
                </select>
              </div>
            )}

            {/* Botones de Acción */}
            <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-lg shadow-blue-600/20"
              >
                {guardando ? 'Guardando...' : 'Guardar Cambios de Ámbito'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};