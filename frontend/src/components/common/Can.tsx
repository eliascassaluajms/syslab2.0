import { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface CanProps {
  /** Código del permiso maestro a validar (ej. 'usuarios:crear', 'fallas:editar') */
  permiso?: string;
  /** Identificador numérico de la carrera o ámbito específico */
  carreraId?: number;
  /** Elementos visuales que se renderizarán si la validación es exitosa */
  children: ReactNode;
  /** Componente o mensaje alternativo a mostrar si NO tiene acceso (por defecto null) */
  fallback?: ReactNode;
}

/**
 * KAN-22.1: Componente Contenedor de Seguridad Visual (Granularidad Fina)
 * Oculta o desmonta elementos de la UI si el usuario autenticado no posee
 * el código de permiso o el ámbito perimetral de carrera requerido.
 */
export const Can = ({
  permiso,
  carreraId,
  children,
  fallback = null,
}: CanProps) => {
  const { user } = useAuth();

  // Si no hay usuario autenticado, desmontar o mostrar el fallback
  if (!user) return <>{fallback}</>;

  // 1. Bypass absoluto para el Administrador Central (Acceso global)
  if (user.rol === 'Administrador') {
    return <>{children}</>;
  }

  // 2. Control por Permiso Granular (RBAC)
  if (permiso && (!user.permisos || !user.permisos.includes(permiso))) {
    return <>{fallback}</>;
  }

  // 3. Control Perimetral por Carrera / Ámbito (ABAC)
  if (carreraId !== undefined && (!user.carreras || !user.carreras.includes(carreraId))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};