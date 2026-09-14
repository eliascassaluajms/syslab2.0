import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ValidacionPagosView } from '../ValidacionPagosView';
import { EventoParticipanteService } from '../../services/eventoParticipante.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('../../services/eventoParticipante.service', () => ({
  EventoParticipanteService: {
    listar: vi.fn().mockResolvedValue([
      {
        id: 'part-1',
        nombre: 'Jorge',
        apellido: 'Aleman',
        correo: 'jorge.aleman@uajms.edu.bo',
        telefono: '71234567',
        tipo: 'PROFESIONAL',
        estado: 'PRE_INSCRITO',
        codigoTransaccion: '10142826090907258247',
        comprobanteUrl: '/comprobantes/comprobante_1789390873475.jpeg',
        montoPagado: 120,
        activity: { id: 'act-1', title: 'CITREN 2026 - Congreso Internacional' },
      },
      {
        id: 'part-2',
        nombre: 'Maria',
        apellido: 'Lopez',
        correo: 'maria.lopez@uajms.edu.bo',
        telefono: '79876543',
        tipo: 'ESTUDIANTE',
        estado: 'PAGO_VERIFICADO',
        codigoTransaccion: '9876543210',
        montoPagado: 80,
        montoBancoReal: 80,
        comprobanteUrl: null,
      },
    ]),
    validarPago: vi.fn().mockResolvedValue({ success: true }),
    actualizar: vi.fn().mockResolvedValue({ id: 'part-1', estado: 'PAGO_VERIFICADO' }),
  },
}));


vi.mock('../../services/httpClient', () => ({
  httpClient: {
    post: vi.fn().mockResolvedValue({ data: { discrepancias: [] } }),
  },
}));

describe('Fase 1 (Frontend) - ValidacionPagosView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza la lista de pagos con métricas y participantes', async () => {
    render(<ValidacionPagosView />);

    await waitFor(() => {
      expect(EventoParticipanteService.listar).toHaveBeenCalled();
    });

    expect(screen.getByText('Validación de Pagos')).toBeInTheDocument();
    expect(screen.getByText('Jorge Aleman')).toBeInTheDocument();
    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('10142826090907258247')).toBeInTheDocument();
  });

  it('al pulsar "Ver Comprobante / OCR" abre el modal con la URL normalizada (/api/comprobantes)', async () => {
    render(<ValidacionPagosView />);

    await waitFor(() => {
      expect(screen.getByText('Jorge Aleman')).toBeInTheDocument();
    });

    const botonVer = screen.getByRole('button', { name: /Ver Comprobante \/ OCR/i });
    fireEvent.click(botonVer);

    // Debe abrir el modal
    expect(screen.getByText('Validación de Comprobante Bancario')).toBeInTheDocument();

    const imagen = screen.getByAltText('Comprobante de Pago Subido') as HTMLImageElement;
    expect(imagen).toBeInTheDocument();
    expect(imagen.src).toContain('/api/comprobantes/comprobante_1789390873475.jpeg');

    // Cerrar con el botón
    const botonCerrar = screen.getByRole('button', { name: '✕ Cerrar' });
    fireEvent.click(botonCerrar);

    expect(screen.queryByText('Validación de Comprobante Bancario')).not.toBeInTheDocument();
  });

  it('muestra estado alternativo en el modal si la imagen falla al cargar', async () => {
    render(<ValidacionPagosView />);

    await waitFor(() => {
      expect(screen.getByText('Jorge Aleman')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Ver Comprobante \/ OCR/i }));

    const imagen = screen.getByAltText('Comprobante de Pago Subido');
    fireEvent.error(imagen);

    expect(await screen.findByText(/No se pudo cargar la vista previa directa/i)).toBeInTheDocument();
    expect(screen.getByText(/Intentar abrir en pestaña nueva ↗/i)).toBeInTheDocument();
  });

  it('permite aprobar un pago pendiente', async () => {
    render(<ValidacionPagosView />);

    await waitFor(() => {
      expect(screen.getByText('Jorge Aleman')).toBeInTheDocument();
    });

    const botonAprobar = screen.getByRole('button', { name: /Aprobar Pago/i });
    fireEvent.click(botonAprobar);

    await waitFor(() => {
      expect(EventoParticipanteService.actualizar).toHaveBeenCalledWith('part-1', { estado: 'PAGO_VERIFICADO' });
    });
  });
});

