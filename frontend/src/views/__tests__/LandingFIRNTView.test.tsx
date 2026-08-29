import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingFIRNTView } from '../LandingFIRNTView';
import { EventoParticipanteService } from '../../services/eventoParticipante.service';
import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  }
}));

vi.mock('../../services/eventoParticipante.service', () => ({
  EventoParticipanteService: {
    obtenerConfiguracionPago: vi.fn().mockResolvedValue({
      banco: 'Banco Bisa',
      numeroCuenta: '123456789',
      nombreReceptor: 'UAJMS FIRNT',
      nitCI: '10203040',
      qrImagenUrl: '/media/qr.png',
    }),
    registrar: vi.fn().mockResolvedValue({ success: true }),
  },
}));

const renderComponent = async () => {
  const rendered = render(
    <BrowserRouter>
      <LandingFIRNTView />
    </BrowserRouter>
  );
  await waitFor(() => {
    expect(EventoParticipanteService.obtenerConfiguracionPago).toHaveBeenCalled();
  });
  return rendered;
};

describe('LandingFIRNTView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza correctamente los elementos principales', async () => {
    await renderComponent();

    expect(screen.getByText(/Universidad Autónoma Juan Misael Saracho/i)).toBeInTheDocument();
    expect(screen.getByText(/Registro de Participantes/i)).toBeInTheDocument();
  });

  it('impide avanzar si el formulario tiene campos obligatorios vacíos', async () => {
    await renderComponent();

    const inputNombre = screen.getByPlaceholderText('Ej. Juan') as HTMLInputElement;
    const inputApellido = screen.getByPlaceholderText('Ej. Pérez') as HTMLInputElement;

    fireEvent.click(screen.getByRole('button', { name: /Continuar al Pago →/i }));

    expect(inputNombre.checkValidity()).toBe(false);
    expect(inputApellido.checkValidity()).toBe(false);
    expect(screen.queryByText(/Validación de Pago del Evento/i)).not.toBeInTheDocument();
  });

  it('abre el modal de pago y envía el formulario correctamente', async () => {
    await renderComponent();

    fireEvent.change(screen.getByPlaceholderText('Ej. Juan'), { target: { value: 'Ana' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. Pérez'), { target: { value: 'Gómez' } });
    fireEvent.change(screen.getByPlaceholderText('correo@uajms.edu.bo'), { target: { value: 'ana@uajms.edu.bo' } });
    fireEvent.change(screen.getByPlaceholderText('70000000'), { target: { value: '79876543' } });

    fireEvent.click(screen.getByRole('button', { name: /Continuar al Pago →/i }));

    expect(screen.getByText(/Validación de Pago del Evento/i)).toBeInTheDocument();

    const inputTransaccion = await screen.findByPlaceholderText('Ej. 98451236');
    fireEvent.change(inputTransaccion, { target: { value: 'TRX-999888' } });

    fireEvent.click(screen.getByRole('button', { name: /Finalizar Preinscripción/i }));

    await waitFor(() => {
      expect(EventoParticipanteService.registrar).toHaveBeenCalled();
      expect(screen.getByText(/¡Preinscripción realizada con éxito!/i)).toBeInTheDocument();
    });
  });
});
