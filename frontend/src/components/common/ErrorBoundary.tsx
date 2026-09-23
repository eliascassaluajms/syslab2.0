import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturó un error no controlado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[70vh] items-center justify-center p-6 text-slate-100">
          <div className="w-full max-w-xl rounded-3xl border border-red-500/30 bg-slate-900/90 p-8 shadow-2xl shadow-red-950/20 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10 text-2xl shadow-inner shadow-red-500/10">
                ⚠️
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-400">
                  Error de Ejecución
                </span>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  Ocurrió un problema en la vista
                </h2>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Se produjo un error inesperado al renderizar este módulo. No te preocupes, el resto del sistema sigue operativo.
            </p>

            {this.state.error && (
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-red-300 font-mono overflow-x-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:bg-blue-500"
              >
                Reintentar vista
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
              >
                Recargar página
              </button>
              <a
                href="/dashboard"
                className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Volver al inicio
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
