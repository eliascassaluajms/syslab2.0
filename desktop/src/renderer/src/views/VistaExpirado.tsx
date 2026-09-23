interface Props {
  motivo: 'expirado' | 'cancelado';
  onReintentar: () => void;
}

export default function VistaExpirado({ motivo, onReintentar }: Props) {
  return (
    <div className="flex h-full items-center justify-center bg-slate-950 p-8">
      <div className="w-full max-w-md rounded-3xl border border-amber-500/40 bg-amber-500/5 p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M9 2h6" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-100">El código ha {motivo}</h2>
        <p className="mt-2 text-sm text-slate-400">
          El tiempo de desbloqueo venció sin que nadie lo utilizara. Genere un nuevo código.
        </p>
        <button type="button" onClick={onReintentar} className="btn-primario mt-6 w-full">
          Generar nuevo código
        </button>
      </div>
    </div>
  );
}