interface Props {
  mensaje: string;
  onReintentar: () => void;
  onVolver: () => void;
}

export default function VistaError({ mensaje, onReintentar, onVolver }: Props) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-8">
      <div className="w-full max-w-md rounded-3xl border border-rose-500/40 bg-rose-500/5 p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="m12 9 4-4m-4 4-4-4m4 4v6m-4 0h8" />
            <circle cx="12" cy="14" r="8" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-100">No se pudo bloquear el equipo</h2>
        <p className="mt-2 text-sm break-words text-slate-400">{mensaje}</p>
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onVolver} className="btn-secundario flex-1">
            Volver
          </button>
          <button type="button" onClick={onReintentar} className="btn-primario flex-1">
            Reintentar
          </button>
        </div>
      </div>
    </div>
  );
}