import React, { useState, useEffect } from 'react';
import { X, Shield, Lock, CheckSquare, Square, MapPin } from 'lucide-react';

export interface Permiso {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
}

export interface Rol {
  id?: number;
  nombre: string;
  descripcion: string;
  activo?: boolean;
  nivelAmbito?: 'GLOBAL' | 'FACULTAD' | 'CARRERA';
  permisos?: string[]; // Lista de códigos
}

export interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rolData: Partial<Rol>) => Promise<void>;
  rolSeleccionado?: Rol | null;
  permisosDisponibles: Permiso[];
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  rolSeleccionado,
  permisosDisponibles,
}) => {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [nivelAmbito, setNivelAmbito] = useState<'GLOBAL' | 'FACULTAD' | 'CARRERA'>('CARRERA');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rolSeleccionado) {
      setNombre(rolSeleccionado.nombre || '');
      setDescripcion(rolSeleccionado.descripcion || '');
      setNivelAmbito(rolSeleccionado.nivelAmbito || 'CARRERA');
      setPermisosSeleccionados(rolSeleccionado.permisos || []);
    } else {
      setNombre('');
      setDescripcion('');
      setNivelAmbito('CARRERA');
      setPermisosSeleccionados([]);
    }
  }, [rolSeleccionado, isOpen]);

  if (!isOpen) return null;

  // Agrupar permisos por módulo dinámicamente
  const modulos = Array.from(new Set(permisosDisponibles.map((p) => p.modulo)));

  const togglePermiso = (codigo: string) => {
    setPermisosSeleccionados((prev) =>
      prev.includes(codigo) ? prev.filter((c) => c !== codigo) : [...prev, codigo]
    );
  };

  const toggleModuloCompleto = (modulo: string) => {
    const codigosModulo = permisosDisponibles
      .filter((p) => p.modulo === modulo)
      .map((p) => p.codigo);

    const todosSeleccionados = codigosModulo.every((c) => permisosSeleccionados.includes(c));

    if (todosSeleccionados) {
      setPermisosSeleccionados((prev) => prev.filter((c) => !codigosModulo.includes(c)));
    } else {
      setPermisosSeleccionados((prev) => Array.from(new Set([...prev, ...codigosModulo])));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave({
        id: rolSeleccionado?.id,
        nombre,
        descripcion,
        nivelAmbito,
        permisos: permisosSeleccionados,
      });
      onClose();
    } catch (error) {
      console.error('Error al guardar el rol:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-slate-800 text-slate-100 rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#1e293b]/50">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold">
              {rolSeleccionado ? `Modificar Rol: ${rolSeleccionado.nombre}` : 'Crear Nuevo Rol'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Información General */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nombre del Rol
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="ej. Encargado de Laboratorio"
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nivel de Ámbito / Perímetro
              </label>
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <select
                  value={nivelAmbito}
                  onChange={(e) => setNivelAmbito(e.target.value as any)}
                  className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="GLOBAL">Global (Toda la universidad / UAJMS)</option>
                  <option value="FACULTAD">Facultad (Restringido a Facultad asignada)</option>
                  <option value="CARRERA">Carrera (Restringido a Carrera/Laboratorio)</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción breve de las responsabilidades"
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Matriz de Permisos */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <h4 className="font-medium text-slate-200">Matriz de Permisos Operativos</h4>
              </div>
              <span className="text-xs text-slate-400">
                {permisosSeleccionados.length} permisos seleccionados
              </span>
            </div>

            <div className="space-y-4">
              {modulos.map((modulo) => {
                const permisosModulo = permisosDisponibles.filter((p) => p.modulo === modulo);
                const todosMarcados = permisosModulo.every((p) =>
                  permisosSeleccionados.includes(p.codigo)
                );

                return (
                  <div key={modulo} className="bg-[#1e293b]/40 border border-slate-800 rounded-lg p-4">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                      <span className="font-semibold text-sm uppercase tracking-wide text-blue-400">
                        Módulo: {modulo}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleModuloCompleto(modulo)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        {todosMarcados ? (
                          <CheckSquare className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                        {todosMarcados ? 'Desmarcar todos' : 'Marcar todos'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {permisosModulo.map((permiso) => {
                        const activo = permisosSeleccionados.includes(permiso.codigo);
                        return (
                          <div
                            key={permiso.codigo}
                            onClick={() => togglePermiso(permiso.codigo)}
                            className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                              activo
                                ? 'bg-blue-600/10 border-blue-500/50 text-white'
                                : 'bg-[#0f172a]/50 border-slate-800 text-slate-400 hover:border-slate-700'
                            }`}
                          >
                            {activo ? (
                              <CheckSquare className="w-4 h-4 text-blue-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-600 shrink-0" />
                            )}
                            <div className="text-xs">
                              <p className="font-medium">{permiso.nombre}</p>
                              <p className="text-[10px] text-slate-500 font-mono">{permiso.codigo}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-600/20 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};