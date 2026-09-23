import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { GestionDefensasView } from '../defensas/GestionDefensasView';
import { ErrorBoundary } from '../../components/common/ErrorBoundary';
import { defensasService } from '../../services/defensas.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    tienePermiso: (permiso: string) => true,
    user: { id: 1, nombre: 'Admin', roles: ['ADMINISTRADOR'] },
  }),
}));

vi.mock('../../hooks/useCatalogos', () => ({
  useCatalogos: () => ({
    carreras: [
      { id: 1, nombre: 'Ingeniería Informática' },
      { id: 2, nombre: 'Ingeniería Química' },
    ],
    facultades: [{ id: 1, nombre: 'Facultad de Ciencias y Tecnología' }],
    loading: false,
  }),
}));

vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    mostrarToast: vi.fn(),
  }),
}));

vi.mock('../../services/defensas.service', () => ({
  defensasService: {
    listarTrabajos: vi.fn(),
    listarMisTrabajos: vi.fn(),
    obtenerControlMemorandum: vi.fn().mockResolvedValue({ ultimoNumero: 5 }),
    actualizarControlMemorandum: vi.fn().mockResolvedValue({ ultimoNumero: 6 }),
    eliminar: vi.fn().mockResolvedValue({ eliminado: true }),
  },
}));

describe('Módulo de Defensas - GestionDefensasView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la vista de defensas correctamente sin ReferenceError ni pantalla en blanco', async () => {
    (defensasService.listarTrabajos as any).mockResolvedValue([
      {
        id: 'trabajo-1',
        titulo: 'Sistema de Reconocimiento Biométrico',
        modalidad: 'Tesis de Grado',
        gradoOptado: 'Licenciatura',
        gestion: 2026,
        estado: 'REGISTRADO',
        estudianteNombre: 'Carlos Mendoza',
        estudianteCi: '1234567',
        estudianteRu: '89101',
        estudianteEmail: 'carlos@uajms.edu.bo',
        carrera: { id: 1, nombre: 'Ingeniería Informática' },
        tribunales: [],
      },
    ]);

    render(<GestionDefensasView />);

    await waitFor(() => {
      expect(screen.getByText('Dirección de Carrera · Defensas de Grado')).toBeDefined();
    });

    expect(defensasService.listarTrabajos).toHaveBeenCalled();
    expect(screen.getByText('Sistema de Reconocimiento Biométrico')).toBeDefined();
    expect(screen.getByText('Carlos Mendoza')).toBeDefined();
    expect(screen.getByText('Total trabajos · Gestión 2026')).toBeDefined();
  });

  it('muestra estado de error y botón de reintento si la petición a defensas falla', async () => {
    (defensasService.listarTrabajos as any).mockRejectedValueOnce(
      new Error('Error de conexión con el servidor')
    );

    render(<GestionDefensasView />);

    await waitFor(() => {
      expect(screen.getByText(/Error de conexión con el servidor|No se pudieron cargar los trabajos/i)).toBeDefined();
    });

    expect(screen.getByRole('button', { name: /Reintentar carga/i })).toBeDefined();

    // Simular que el reintento funciona
    (defensasService.listarTrabajos as any).mockResolvedValueOnce([]);
    fireEvent.click(screen.getByRole('button', { name: /Reintentar carga/i }));

    await waitFor(() => {
      expect(defensasService.listarTrabajos).toHaveBeenCalledTimes(2);
    });
  });

  it('ErrorBoundary captura fallos en componentes hijos y previene la pantalla en blanco', () => {
    const ComponenteConFallo: React.FC = () => {
      throw new Error('Fallo crítico simulado en render');
    };

    render(
      <ErrorBoundary>
        <ComponenteConFallo />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ocurrió un problema en la vista')).toBeDefined();
    expect(screen.getByText('Reintentar vista')).toBeDefined();
    expect(screen.getByText('Recargar página')).toBeDefined();
  });
});
