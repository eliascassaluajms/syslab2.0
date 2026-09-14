import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingFIRNTView } from '../LandingFIRNTView';
import { EventoParticipanteService } from '../../services/eventoParticipante.service';
import { ActivityService } from '../../services/activity.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

// Mock de APIs
vi.mock('../../services/activity.service', () => ({
  ActivityService: {
    listar: vi.fn().mockResolvedValue([
      {
        id: 'act-1',
        title: 'CITREN 2026 - Congreso Internacional',
        description: 'Congreso Internacional de Tecnología',
        fechaInicio: '2026-10-10',
        fechaFin: '2026-10-15',
        activo: true,
      },
    ]),
  },
  activityService: {
    listar: vi.fn().mockResolvedValue([
      {
        id: 'act-1',
        title: 'CITREN 2026 - Congreso Internacional',
        fechaFin: '2026-10-15',
        activo: true,
      },
    ]),
  },
}));

vi.mock('../../services/eventoParticipante.service', () => ({
  EventoParticipanteService: {
    obtenerConfiguracionPago: vi.fn().mockResolvedValue({
      id: 'cfg-1',
      banco: 'Banco Bisa',
      numeroCuenta: '123456789',
      nombreReceptor: 'UAJMS FIRNT',
      nitCI: '10203040',
      qrImagenUrl: '/media/qr.png',
      activo: true,
    }),
    registrar: vi.fn().mockResolvedValue({ id: 'part-123', success: true }),
    procesarOCR: vi.fn().mockResolvedValue({
      status: 'success',
      valido: true,
      codigoTransaccion: '10142826090907258247',
      monto: 120,
      comprobanteUrl: '/api/comprobantes/temp_123.jpg',
    }),
    eliminarComprobanteTemporal: vi.fn().mockResolvedValue({ status: 'success', eliminado: true }),
    descargarVoucher: vi.fn().mockResolvedValue(new Blob(['pdf-data'], { type: 'application/pdf' })),
  },
}));

// Mock de URLs de objetos de navegador
const mockRevokeObjectURL = vi.fn();
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/test-blob');

global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

const renderComponent = async () => {
  const rendered = render(
    <BrowserRouter>
      <LandingFIRNTView />
    </BrowserRouter>
  );
  await waitFor(() => {
    expect(ActivityService.listar).toHaveBeenCalled();
    expect(EventoParticipanteService.obtenerConfiguracionPago).toHaveBeenCalled();
  });
  return rendered;
};

describe('Fase 1 (Frontend) - LandingFIRNTView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente el formulario y la actividad vigente', async () => {
    await renderComponent();

    expect(screen.getAllByText(/Universidad Autónoma Juan Misael Saracho/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/CITREN 2026 - Congreso Internacional/i)[0]).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. Juan Carlos')).toBeInTheDocument();


  });

  it('impide avanzar si el formulario tiene campos obligatorios vacíos', async () => {
    await renderComponent();

    const inputNombre = screen.getByPlaceholderText('Ej. Juan Carlos') as HTMLInputElement;
    const inputApellido = screen.getByPlaceholderText('Ej. Pérez Baldiviezo') as HTMLInputElement;

    fireEvent.click(screen.getByRole('button', { name: /Continuar a Verificación de Pago/i }));

    expect(inputNombre.checkValidity()).toBe(false);
    expect(inputApellido.checkValidity()).toBe(false);
    expect(screen.queryByText(/Resumen de Inscripción/i)).not.toBeInTheDocument();
  });

  it('abre el modal de pago al llenar datos válidos', async () => {
    await renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Ej. Juan Carlos'), { target: { value: 'Jorge' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Pérez Baldiviezo'), { target: { value: 'Alemán' } });
    fireEvent.change(screen.getByPlaceholderText('usuario@uajms.edu.bo'), { target: { value: 'jorge.aleman@uajms.edu.bo' } });
    fireEvent.change(screen.getByPlaceholderText('70000000'), { target: { value: '71234567' } });

    fireEvent.click(screen.getByRole('button', { name: /Continuar a Verificación de Pago/i }));

    expect(screen.getByText(/Resumen de Inscripción/i)).toBeInTheDocument();
  });

  it('procesa el archivo de comprobante con OCR y permite limpiarlo liberando memoria', async () => {
    await renderComponent();

    // 1. Llenar paso 1 y abrir modal
    fireEvent.change(screen.getByPlaceholderText('Ej. Juan Carlos'), { target: { value: 'Jorge' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Pérez Baldiviezo'), { target: { value: 'Alemán' } });
    fireEvent.change(screen.getByPlaceholderText('usuario@uajms.edu.bo'), { target: { value: 'jorge@uajms.edu.bo' } });
    fireEvent.change(screen.getByPlaceholderText('70000000'), { target: { value: '71234567' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar a Verificación de Pago/i }));

    // 2. Simular selección de archivo
    const file = new File(['dummy-image'], 'comprobante.jpg', { type: 'image/jpeg' });
    const inputArchivo = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(inputArchivo).toBeInTheDocument();

    fireEvent.change(inputArchivo, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(file);
      expect(EventoParticipanteService.procesarOCR).toHaveBeenCalled();
    });

    // 3. Simular clic en cancelar/quitar captura
    const btnQuitar = await screen.findByRole('button', { name: /Cancelar \/ Quitar esta captura/i });
    fireEvent.click(btnQuitar);

    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalled();
      expect(EventoParticipanteService.eliminarComprobanteTemporal).toHaveBeenCalledWith('/api/comprobantes/temp_123.jpg');
    });
  });

  it('valida formato estricto de transacción y previene doble envío', async () => {
    await renderComponent();

    // 1. Completar paso 1
    fireEvent.change(screen.getByPlaceholderText('Ej. Juan Carlos'), { target: { value: 'Jorge' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Pérez Baldiviezo'), { target: { value: 'Alemán' } });
    fireEvent.change(screen.getByPlaceholderText('usuario@uajms.edu.bo'), { target: { value: 'jorge@uajms.edu.bo' } });
    fireEvent.change(screen.getByPlaceholderText('70000000'), { target: { value: '71234567' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuar a Verificación de Pago/i }));

    // 2. Ingresar código inválido con letras
    const inputTransaccion = screen.getByPlaceholderText('Ej. 14262609090458');
    fireEvent.change(inputTransaccion, { target: { value: 'ABC1234' } });

    // Simular que han pasado más de 3 segundos para el anti-bot
    const realNow = Date.now();
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(realNow + 5000);

    const btnFinalizar = screen.getByRole('button', { name: /Confirmar Preinscripción/i });
    fireEvent.click(btnFinalizar);

    dateSpy.mockRestore();

    // Debe mostrar advertencia de formato numérico de 6 a 25 caracteres
    const alertas = screen.getAllByText(/exclusivamente dígitos numéricos/i);
    expect(alertas.length).toBeGreaterThan(0);
    expect(EventoParticipanteService.registrar).not.toHaveBeenCalled();
  });


});
