import { Request, Response } from 'express';
import { EquiposService } from '../services/equipos.service.js';

export const crearEquipo = async (req: Request, res: Response) => {
  try {
    const nuevoEquipo = await EquiposService.crearEquipo(req.body);
    res.status(201).json({ ok: true, data: nuevoEquipo });
  } catch (error: any) {
    res.status(400).json({ 
      ok: false, 
      message: error.message || 'Error al crear el equipo.' 
    });
  }
};

export const crearLoteEquipos = async (req: Request, res: Response) => {
  try {
    const resultado = await EquiposService.crearLoteEquipos(req.body);
    res.status(201).json({ ok: true, ...resultado });
  } catch (error: any) {
    res.status(400).json({ 
      ok: false, 
      message: error.message || 'Error al generar el lote de equipos.' 
    });
  }
};

export const listarEquiposPorLaboratorio = async (req: Request, res: Response) => {
  try {
    const { laboratorioId } = req.params;
    const equipos = await EquiposService.obtenerEquiposPorLaboratorio(Number(laboratorioId));
    res.json({ ok: true, data: equipos });
  } catch (error: any) {
    res.status(500).json({ ok: false, message: 'Error al listar equipos.' });
  }
};