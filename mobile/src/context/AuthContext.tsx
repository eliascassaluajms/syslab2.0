import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { UsuarioSesion } from '../types/api';
import {
  eliminarSesion,
  obtenerToken,
  obtenerUsuario,
  guardarToken,
  guardarUsuario,
} from '../services/storage';

interface AuthContextValue {
  token: string | null;
  usuario: UsuarioSesion | null;
  cargando: boolean;
  iniciarSesion: (token: string, usuario: UsuarioSesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const [t, u] = await Promise.all([obtenerToken(), obtenerUsuario()]);
      setToken(t);
      setUsuario(u);
      setCargando(false);
    })();
  }, []);

  const iniciarSesion = useCallback(async (nuevoToken: string, nuevoUsuario: UsuarioSesion) => {
    await Promise.all([guardarToken(nuevoToken), guardarUsuario(nuevoUsuario)]);
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await eliminarSesion();
    setToken(null);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({ token, usuario, cargando, iniciarSesion, cerrarSesion }),
    [token, usuario, cargando, iniciarSesion, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>.');
  }
  return ctx;
}