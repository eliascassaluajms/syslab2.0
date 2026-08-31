import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';

export const EventoPaymentConfigController = {
  /**
   * Obtiene la primera configuración de pago que esté activa.
   * Ideal para mostrar a los participantes al momento de inscribirse.
   */
  async obtenerActivo(req: Request, res: Response): Promise<void> {
    try {
      const config = await prisma.eventoPaymentConfig.findFirst({
        where: { activo: true },
      });
      
      if (!config) {
        res.status(404).json({ message: 'No hay configuraciones de pago activas en este momento.' });
        return;
      }

      res.status(200).json(config);
    } catch (error) {
      console.error('Error al obtener configuración de pago:', error);
      res.status(500).json({ error: 'Error al obtener la configuración de pago.' });
    }
  },

  /**
   * Crea o actualiza una configuración de pago.
   */
  async guardar(req: Request, res: Response): Promise<void> {
    try {
      const { id, banco, numeroCuenta, nombreReceptor, nitCI, qrImagenUrl, activo } = req.body;

      if (id) {
        const actualizado = await prisma.eventoPaymentConfig.update({
          where: { id },
          data: { banco, numeroCuenta, nombreReceptor, nitCI, qrImagenUrl, activo },
        });
        res.status(200).json(actualizado);
      } else {
        // Si se crea uno nuevo, podríamos desactivar los anteriores para mantener solo uno activo
        if (activo !== false) {
          await prisma.eventoPaymentConfig.updateMany({
            where: { activo: true },
            data: { activo: false },
          });
        }

        const nuevo = await prisma.eventoPaymentConfig.create({
          data: { 
            banco, 
            numeroCuenta, 
            nombreReceptor, 
            nitCI, 
            qrImagenUrl, 
            activo: activo ?? true 
          },
        });
        res.status(201).json(nuevo);
      }
    } catch (error) {
      console.error('Error al guardar configuración de pago:', error);
      res.status(500).json({ error: 'Error al guardar la configuración de pago.' });
    }
  },
};