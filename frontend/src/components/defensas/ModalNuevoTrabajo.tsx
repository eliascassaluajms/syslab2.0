import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useCatalogos } from '../../hooks/useCatalogos';
import { useAuth } from '../../context/AuthContext';
import { defensasService } from '../../services/defensas.service';
import { httpClient } from '../../services/httpClient';
import { useToast } from '../../context/ToastContext';
import { EstudianteElegible } from '../../interfaces/defensa';

interface ModalNuevoTrabajoProps {
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
  carreraFijadaId?: number | null;
}

interface MateriaOption {
  id: number;
  codigo: string;
  nombre: string;
  semestre?: number;
}

const initialForm = {
  titulo: '',
  modalidad: 'Trabajo Dirigido',
  gradoOptado: 'Licenciatura en Ingeniería Informática',
  gestion: String(new Date().getFullYear()),
  carreraId: '',
  materiaId: '',
  estudianteNombre: '',
  estudianteCi: '',
  estudianteRu: '',
  estudianteEmail: '',
  estudianteTelefono: '',
  estudianteUsuarioId: undefined as number | undefined,
};

export const ModalNuevoTrabajo: React.FC<ModalNuevoTrabajoProps> = ({
  abierto,
  onCerrar,
  onCreado,
  carreraFijadaId,
}) => {
  const { user } = useAuth();
  const { carreras, loading: cargandoCatalogos } = useCatalogos();
  const { mostrarToast } = useToast();

  const [form, setForm] = useState(initialForm);
  const [guardando, setGuardando] = useState(false);

  // Estados para Materias de la Carrera
  const [materias, setMaterias] = useState<MateriaOption[]>([]);
  const [cargandoMaterias, setCargandoMaterias] = useState(false);

  // Estados para Estudiantes (Taller III y búsqueda excepcional)
  const [estudiantes, setEstudiantes] = useState<EstudianteElegible[]>([]);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(false);
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [desplegableAbierto, setDesplegableAbierto] = useState(false);
  const [modoBusquedaGeneral, setModoBusquedaGeneral] = useState(false);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<EstudianteElegible | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determinar si la usuaria es Directora de Carrera
  const esDirector = useMemo(() => {
    if (user?.esGlobal) return false;
    const rolNombre = typeof user?.rol === 'string' ? user.rol : user?.rol?.nombre || '';
    const rolesArr = Array.isArray(user?.roles)
      ? user.roles.map((r) => (typeof r === 'string' ? r : r.nombre))
      : [];
    return rolNombre.includes('Director de Carrera') || rolesArr.some((r) => r.includes('Director de Carrera'));
  }, [user]);

  const carreraDirectorId = useMemo(() => {
    if (carreraFijadaId) return carreraFijadaId;
    if (!esDirector) return null;
    return user?.carreraId || (user?.carreras && user.carreras.length > 0 ? user.carreras[0] : null);
  }, [carreraFijadaId, esDirector, user]);

  // Restringir opciones de carreras si es Directora
  const opcionesCarreras = useMemo(() => {
    if (esDirector && carreraDirectorId) {
      return (carreras || []).filter((c) => c.id === carreraDirectorId);
    }
    return carreras || [];
  }, [carreras, esDirector, carreraDirectorId]);

  // Inicializar o auto-fijar carrera
  useEffect(() => {
    if (abierto) {
      setForm((prev) => ({
        ...initialForm,
        carreraId: carreraDirectorId ? String(carreraDirectorId) : prev.carreraId || (opcionesCarreras[0] ? String(opcionesCarreras[0].id) : ''),
      }));
      setEstudianteSeleccionado(null);
      setTextoBusqueda('');
      setModoBusquedaGeneral(false);
    }
  }, [abierto, carreraDirectorId, opcionesCarreras]);

  // Cerrar menú flotante al hacer clic afuera
  useEffect(() => {
    const handleClickAfuera = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDesplegableAbierto(false);
      }
    };
    document.addEventListener('mousedown', handleClickAfuera);
    return () => document.removeEventListener('mousedown', handleClickAfuera);
  }, []);

  // 1. Cargar materias de la carrera seleccionada
  useEffect(() => {
    if (!form.carreraId) {
      setMaterias([]);
      return;
    }

    const cargarMaterias = async () => {
      try {
        setCargandoMaterias(true);
        const res = await httpClient.get('/materias', { params: { carreraId: form.carreraId } });
        const lista: MateriaOption[] = Array.isArray(res.data?.data?.materias)
          ? res.data.data.materias
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

        setMaterias(lista);

        // Preseleccionar automáticamente Taller III o Trabajo de Grado si existe
        const materiaTitulacion = lista.find(
          (m) =>
            m.codigo.toLowerCase().includes('501') ||
            m.nombre.toLowerCase().includes('taller iii') ||
            m.nombre.toLowerCase().includes('taller 3') ||
            m.nombre.toLowerCase().includes('trabajo de grado')
        );

        if (materiaTitulacion) {
          setForm((prev) => ({ ...prev, materiaId: String(materiaTitulacion.id) }));
        }
      } catch (error) {
        console.error('Error al cargar materias de la carrera:', error);
      } finally {
        setCargandoMaterias(false);
      }
    };

    cargarMaterias();
  }, [form.carreraId]);

  // 2. Cargar estudiantes elegibles (Taller III por defecto o búsqueda general)
  useEffect(() => {
    if (!form.carreraId || !abierto) return;

    const cargarEstudiantes = async () => {
      try {
        setCargandoEstudiantes(true);
        const datos = await defensasService.obtenerEstudiantesElegibles({
          carreraId: Number(form.carreraId),
          materiaId: form.materiaId ? Number(form.materiaId) : undefined,
          gestion: Number(form.gestion) || undefined,
          busqueda: textoBusqueda.trim() || undefined,
          todos: modoBusquedaGeneral,
        });
        setEstudiantes(datos || []);
      } catch (error) {
        console.error('Error al cargar estudiantes elegibles:', error);
        setEstudiantes([]);
      } finally {
        setCargandoEstudiantes(false);
      }
    };

    const timer = setTimeout(() => {
      cargarEstudiantes();
    }, 250);

    return () => clearTimeout(timer);
  }, [form.carreraId, form.materiaId, form.gestion, textoBusqueda, modoBusquedaGeneral, abierto]);

  // Estudiantes filtrados en tiempo real según lo que escribe el usuario
  const estudiantesFiltrados = useMemo(() => {
    if (!textoBusqueda.trim()) return estudiantes;
    const term = textoBusqueda.toLowerCase().trim();
    return estudiantes.filter(
      (e) =>
        e.nombreCompleto.toLowerCase().includes(term) ||
        (e.ru && e.ru.toLowerCase().includes(term)) ||
        (e.correo && e.correo.toLowerCase().includes(term))
    );
  }, [estudiantes, textoBusqueda]);

  const handleChange = (campo: string, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const seleccionarEstudiante = (est: EstudianteElegible) => {
    setEstudianteSeleccionado(est);
    setTextoBusqueda(est.nombreCompleto);
    setDesplegableAbierto(false);
    setForm((prev) => ({
      ...prev,
      estudianteNombre: est.nombreCompleto,
      estudianteRu: est.ru || '',
      estudianteCi: est.ci || prev.estudianteCi,
      estudianteEmail: est.correo || '',
      estudianteTelefono: est.telefono || prev.estudianteTelefono,
      estudianteUsuarioId: est.id,
    }));
  };

  const limpiarEstudiante = () => {
    setEstudianteSeleccionado(null);
    setTextoBusqueda('');
    setForm((prev) => ({
      ...prev,
      estudianteNombre: '',
      estudianteRu: '',
      estudianteCi: '',
      estudianteEmail: '',
      estudianteTelefono: '',
      estudianteUsuarioId: undefined,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.titulo.trim() || !form.estudianteNombre.trim() || !form.carreraId) {
      mostrarToast('Complete el título, la carrera y los datos del estudiante.', 'error');
      return;
    }

    try {
      setGuardando(true);
      await defensasService.crear({
        titulo: form.titulo.trim(),
        modalidad: form.modalidad.trim(),
        gradoOptado: form.gradoOptado.trim(),
        gestion: Number(form.gestion) || undefined,
        carreraId: Number(form.carreraId),
        materiaId: form.materiaId ? Number(form.materiaId) : undefined,
        estudianteNombre: form.estudianteNombre.trim(),
        estudianteCi: form.estudianteCi.trim(),
        estudianteRu: form.estudianteRu.trim(),
        estudianteEmail: form.estudianteEmail.trim(),
        estudianteTelefono: form.estudianteTelefono.trim() || undefined,
        estudianteUsuarioId: form.estudianteUsuarioId,
      });

      mostrarToast('Trabajo de grado registrado correctamente.', 'success');
      setForm(initialForm);
      onCreado();
      onCerrar();
    } catch (error: any) {
      mostrarToast(
        error?.response?.data?.message || error?.message || 'No se pudo registrar el trabajo de grado.',
        'error'
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl shadow-slate-950/50 my-8">
        <div className="flex items-center justify-between border-b border-slate-800 bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-950 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/10 text-lg">
              📄
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-blue-300">Registro académico de titulación</p>
              <h2 className="mt-0.5 text-xl font-bold text-white">Nuevo trabajo de grado</h2>
            </div>
          </div>
          <button
            onClick={onCerrar}
            className="rounded-lg border border-slate-700 px-2.5 py-1 text-slate-300 hover:bg-slate-800 transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Título */}
            <label className="md:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Título del trabajo de grado *
              </span>
              <input
                value={form.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
                placeholder="Ej. Sistema inteligente para el monitoreo de recursos hídricos..."
                required
              />
            </label>

            {/* Carrera (Restringida para Directora) */}
            <label>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Carrera *
                </span>
                {esDirector && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                    Tu Carrera
                  </span>
                )}
              </div>
              <select
                value={form.carreraId}
                onChange={(e) => handleChange('carreraId', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 disabled:opacity-80 disabled:cursor-not-allowed"
                disabled={cargandoCatalogos || (esDirector && Boolean(carreraDirectorId))}
                required
              >
                {!esDirector && <option value="">Seleccione una carrera</option>}
                {opcionesCarreras.map((carrera) => (
                  <option key={carrera.id} value={carrera.id}>
                    {carrera.nombre}
                  </option>
                ))}
              </select>
            </label>

            {/* Materia de Titulación */}
            <label>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Materia de titulación
                </span>
                {cargandoMaterias && (
                  <span className="text-[10px] text-blue-300 animate-pulse">Cargando materias...</span>
                )}
              </div>
              <select
                value={form.materiaId}
                onChange={(e) => handleChange('materiaId', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
                disabled={cargandoMaterias || materias.length === 0}
              >
                <option value="">Seleccione una materia (opcional)</option>
                {materias.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                  </option>
                ))}
              </select>
            </label>

            {/* Modalidad */}
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Modalidad de graduación
              </span>
              <select
                value={form.modalidad}
                onChange={(e) => handleChange('modalidad', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              >
                <option value="Trabajo Dirigido">Trabajo Dirigido</option>
                <option value="Tesis de Grado">Tesis de Grado</option>
                <option value="Proyecto de Grado">Proyecto de Grado</option>
                <option value="Excelencia Académica">Excelencia Académica</option>
                <option value="Vía Diplomado">Vía Diplomado</option>
                <option value="Examen de Grado">Examen de Grado</option>
              </select>
            </label>

            {/* Grado Académico */}
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Grado optado
              </span>
              <input
                value={form.gradoOptado}
                onChange={(e) => handleChange('gradoOptado', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </label>

            {/* Gestión Académica */}
            <label>
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Gestión académica
              </span>
              <input
                type="number"
                min="2020"
                max="2100"
                value={form.gestion}
                onChange={(e) => handleChange('gestion', e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
              />
            </label>

            {/* ─── SECCIÓN DEL ESTUDIANTE CON SELECT / BUSCADOR INTERACTIVO ─── */}
            <div className="md:col-span-2 rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎓</span>
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-blue-200">
                    Estudiante postulante
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoBusquedaGeneral(!modoBusquedaGeneral);
                      setTextoBusqueda('');
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                      modoBusquedaGeneral
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{modoBusquedaGeneral ? '🔄 Modo:' : '🔍'}</span>
                    <span>{modoBusquedaGeneral ? 'Toda la Base de Datos' : 'Solo Taller III'}</span>
                  </button>
                </div>
              </div>

              {/* Input Select con Autocompletado */}
              <div className="relative" ref={dropdownRef}>
                <div className="relative">
                  <input
                    type="text"
                    value={textoBusqueda}
                    onChange={(e) => {
                      setTextoBusqueda(e.target.value);
                      handleChange('estudianteNombre', e.target.value);
                      setDesplegableAbierto(true);
                      if (estudianteSeleccionado && e.target.value !== estudianteSeleccionado.nombreCompleto) {
                        setEstudianteSeleccionado(null);
                        setForm((prev) => ({ ...prev, estudianteUsuarioId: undefined }));
                      }
                    }}
                    onFocus={() => setDesplegableAbierto(true)}
                    placeholder="Escriba el nombre, apellido o RU del estudiante para seleccionar..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-blue-500 pr-10"
                  />
                  {cargandoEstudiantes ? (
                    <div className="absolute right-3 top-3 h-4 w-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                  ) : estudianteSeleccionado ? (
                    <button
                      type="button"
                      onClick={limpiarEstudiante}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-rose-400 text-sm"
                      title="Quitar selección"
                    >
                      ✕
                    </button>
                  ) : null}
                </div>

                {/* Desplegable de coincidencias */}
                {desplegableAbierto && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-1.5 shadow-2xl shadow-slate-950/80">
                    <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800 flex justify-between items-center">
                      <span>{modoBusquedaGeneral ? 'Estudiantes (Base general)' : 'Inscritos en Taller III'}</span>
                      <span className="text-blue-400">{estudiantesFiltrados.length} disponibles</span>
                    </div>

                    {estudiantesFiltrados.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400 space-y-2">
                        <p>No se encontraron coincidencias en {modoBusquedaGeneral ? 'estudiantes' : 'Taller III'}.</p>
                        {!modoBusquedaGeneral && (
                          <button
                            type="button"
                            onClick={() => setModoBusquedaGeneral(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/30 px-3 py-1 text-xs text-blue-200 hover:bg-blue-600/30 transition"
                          >
                            <span>🔍 Buscar en todos los estudiantes de la facultad</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      estudiantesFiltrados.map((est) => (
                        <div
                          key={est.id}
                          onClick={() => seleccionarEstudiante(est)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-600/10 cursor-pointer transition text-left group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-blue-300">
                              {est.nombre.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white group-hover:text-blue-300">
                                {est.nombreCompleto}
                              </p>
                              <p className="text-xs text-slate-400">
                                {est.ru ? `RU: ${est.ru}` : ''} {est.correo ? `· ${est.correo}` : ''}
                              </p>
                            </div>
                          </div>
                          {est.esTallerIII && (
                            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              Taller III
                            </span>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Campos derivados del estudiante (Editables por si requiere ajuste) */}
              <div className="grid gap-3 md:grid-cols-3 pt-1">
                <label>
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    RU
                  </span>
                  <input
                    value={form.estudianteRu}
                    onChange={(e) => handleChange('estudianteRu', e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    placeholder="Ej. 12345"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    CI
                  </span>
                  <input
                    value={form.estudianteCi}
                    onChange={(e) => handleChange('estudianteCi', e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    placeholder="Ej. 1234567"
                  />
                </label>

                <label>
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Teléfono
                  </span>
                  <input
                    value={form.estudianteTelefono}
                    onChange={(e) => handleChange('estudianteTelefono', e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    placeholder="Ej. 70000000"
                  />
                </label>

                <label className="md:col-span-3">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Correo institucional
                  </span>
                  <input
                    type="email"
                    value={form.estudianteEmail}
                    onChange={(e) => handleChange('estudianteEmail', e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-blue-500"
                    placeholder="estudiante@uajms.edu.bo"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500 disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar trabajo de grado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
