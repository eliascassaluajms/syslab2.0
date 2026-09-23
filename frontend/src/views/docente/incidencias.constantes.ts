import type {
  EstadoIncidencia,
  PrioridadIncidencia,
  TipoIncidencia,
  CategoriaEquipoIncidencia,
} from '../../interfaces/incidencia.interface';

export const ETIQUETAS_ESTADO: Record<EstadoIncidencia, string> = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revisión',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  DESCARTADO: 'Descartado',
};

export const ESTILOS_ESTADO: Record<EstadoIncidencia, string> = {
  PENDIENTE: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  EN_REVISION: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  EN_PROCESO: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  RESUELTO: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  DESCARTADO: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export const ETIQUETAS_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  BAJA: 'Leve',
  MEDIA: 'Moderada',
  ALTA: 'Alta',
  CRITICA: 'Crítica',
};

export const ESTILOS_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  BAJA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  MEDIA: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ALTA: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  CRITICA: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export const ETIQUETAS_TIPO: Record<TipoIncidencia, string> = {
  HARDWARE: 'Hardware',
  SOFTWARE: 'Software',
  RED: 'Red / Internet',
  INFRAESTRUCTURA: 'Infraestructura',
};

export const ETIQUETAS_CATEGORIA: Record<CategoriaEquipoIncidencia, string> = {
  PC: 'PC / Equipo de escritorio',
  PROYECTOR: 'Proyector',
  AIRE_ACONDICIONADO: 'Aire acondicionado',
  RED_INTERNET: 'Red / Internet',
  PERIFERICO: 'Periférico',
  SOFTWARE: 'Software',
  OTRO: 'Otro',
};

export const PASOS_STEPPER = [
  { clave: 'PENDIENTE', etiqueta: 'Ticket recibido', descripcion: 'Reporte registrado y canalizado' },
  { clave: 'EN_REVISION', etiqueta: 'Asignado a técnico', descripcion: 'Encargado de laboratorio asignado' },
  { clave: 'EN_PROCESO', etiqueta: 'Diagnóstico en proceso', descripcion: 'Se trabaja en la solución' },
  { clave: 'RESUELTO', etiqueta: 'Solucionado y verificado', descripcion: 'Falla atendida' },
];

export const ORDEN_ESTADOS: EstadoIncidencia[] = ['PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'RESUELTO'];

export const categoriaEquipoDeEquipo = (equipo?: { nombre?: string } | null): CategoriaEquipoIncidencia => {
  const nombre = (equipo?.nombre || '').toLowerCase();
  if (nombre.includes('proyector')) return 'PROYECTOR';
  if (nombre.includes('aire')) return 'AIRE_ACONDICIONADO';
  if (nombre.includes('impresora') || nombre.includes('mouse') || nombre.includes('teclado')) return 'PERIFERICO';
  if (nombre.includes('router') || nombre.includes('switch') || nombre.includes('red')) return 'RED_INTERNET';
  return 'PC';
};