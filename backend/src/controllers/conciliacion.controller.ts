import { Request, Response, NextFunction } from 'express';
import * as xlsx from 'xlsx';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

const normalizarClave = (valor: unknown): string => String(valor ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]/g, '');

const convertirMonto = (valor: unknown): number => {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  const texto = String(valor ?? '').replace(/[^\d,.-]/g, '').trim();
  const limpio = texto.includes(',') && texto.includes('.')
    ? texto.replace(/,/g, '')
    : texto.replace(',', '.');
  const monto = Number(limpio);
  return Number.isFinite(monto) ? monto : 0;
};

interface MovimientoBancario {
  fecha: string;
  descripcion: string;
  nroDocumento: string;
  monto: number;
}

export class ConciliacionController {
  async procesarExtractoBancario(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError('Debes adjuntar el archivo Excel o CSV del extracto bancario.', 400);
      }

      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new AppError('El extracto no contiene ninguna hoja de datos.', 400);
      }

      const filas = xlsx.utils.sheet_to_json<unknown[][]>(
        workbook.Sheets[firstSheetName],
        { header: 1, defval: '' },
      );
      let headerRowIndex = -1;
      let colFecha = 0;
      let colDescripcion = 12;
      let colNroDocumento = 26;
      let colMonto = 32;

      for (let rowIndex = 0; rowIndex < filas.length; rowIndex += 1) {
        const rowText = filas[rowIndex].map((cell) => String(cell)).join(' ').toLowerCase();
        if (!rowText.includes('fecha movimiento') && !rowText.includes('nro documento')) continue;

        headerRowIndex = rowIndex;
        filas[rowIndex].forEach((cell, columnIndex) => {
          const header = String(cell).trim().toLowerCase().replace(/\s+/g, ' ');
          if (header.includes('fecha')) colFecha = columnIndex;
          if (header.includes('descripci')) colDescripcion = columnIndex;
          if (header.includes('nro documento') || header === 'documento') colNroDocumento = columnIndex;
          if (header.includes('monto')) colMonto = columnIndex;
        });
        break;
      }

      if (headerRowIndex === -1) {
        throw new AppError(
          'No se encontró la cabecera estándar (Fecha Movimiento, Nro Documento, Monto) en el extracto.',
          422,
        );
      }

      const movimientos: MovimientoBancario[] = [];
      for (let rowIndex = headerRowIndex + 1; rowIndex < filas.length; rowIndex += 1) {
        const fila = filas[rowIndex];
        const rowText = fila.map((cell) => String(cell)).join(' ').toLowerCase();
        if (rowText.includes('total crédito') || rowText.includes('total debito') || rowText.includes('total débito')) break;

        const fecha = String(fila[colFecha] ?? '').trim();
        const nroDocumento = String(fila[colNroDocumento] ?? '').trim();
        const monto = convertirMonto(fila[colMonto]);
        if (!fecha || !nroDocumento || monto <= 0) continue;

        movimientos.push({
          fecha,
          descripcion: String(fila[colDescripcion] ?? '').trim(),
          nroDocumento,
          monto,
        });
      }

      const participantesPendientes = await prisma.eventoParticipante.findMany({
        where: { estado: 'PRE_INSCRITO' },
      });
      const transaccionesProcesadas = new Set<string>();
      const conciliados: Array<Record<string, unknown>> = [];
      const noEmparejadosBanco: MovimientoBancario[] = [];
      const discrepanciasMonto: Array<Record<string, unknown>> = [];

      for (const movimiento of movimientos) {
        const transaccion = movimiento.nroDocumento;
        if (transaccionesProcesadas.has(transaccion)) continue;
        transaccionesProcesadas.add(transaccion);

        const match = participantesPendientes.find((participante) => {
          const codigo = participante.codigoTransaccion?.trim();
          return Boolean(codigo && (
            codigo === transaccion ||
            movimiento.descripcion.includes(codigo) ||
            transaccion.includes(codigo)
          ));
        });
        if (!match) {
          noEmparejadosBanco.push(movimiento);
          continue;
        }

        const montoDeclarado = Number(match.montoPagado || 0);
        const diferencia = Number((movimiento.monto - montoDeclarado).toFixed(2));
        if (Math.abs(diferencia) >= 0.01) {
          discrepanciasMonto.push({
            participanteId: match.id,
            nombre: `${match.nombre} ${match.apellido}`,
            telefono: match.telefono,
            transaccion,
            montoDeclarado,
            montoRealBanco: movimiento.monto,
            diferencia,
          });
          continue;
        }

        await prisma.eventoParticipante.update({
          where: { id: match.id },
          data: { estado: 'PAGO_VERIFICADO', montoBancoReal: movimiento.monto },
        });
        conciliados.push({
          participanteId: match.id,
          nombre: `${match.nombre} ${match.apellido}`,
          correo: match.correo,
          transaccion,
          montoAbonado: movimiento.monto,
          fechaPago: movimiento.fecha,
        });
      }

      res.status(200).json({
        status: 'success',
        message: `Conciliación completada. Se validaron ${conciliados.length} pagos automáticamente.`,
        data: {
          totalFilas: filas.length,
          totalAbonosLeidos: movimientos.length,
          totalProcesados: conciliados.length,
          totalConciliados: conciliados.length,
          conciliados,
          noEmparejadosBanco,
          discrepanciasMonto,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerReporteFinanciero(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { actividadId } = req.params;
      const actividad = await prisma.activity.findUnique({
        where: { id: actividadId },
        include: { eventoParticipantes: true },
      });
      if (!actividad) throw new AppError('Actividad o evento no encontrado.', 404);

      const participantes = actividad.eventoParticipantes;
      const verificados = participantes.filter((participante) =>
        participante.estado === 'PAGO_VERIFICADO' || participante.estado === 'ASISTENCIA_CONFIRMADA');
      const pendientes = participantes.filter((participante) => participante.estado === 'PRE_INSCRITO');
      const rechazados = participantes.filter((participante) => participante.estado === 'RECHAZADO');
      const totalVerificado = verificados.reduce((total, participante) => total + Number(participante.montoBancoReal || participante.montoPagado || 0), 0);
      const totalPendiente = pendientes.reduce((total, participante) => total + Number(participante.montoPagado || 0), 0);

      res.status(200).json({
        status: 'success',
        data: {
          actividad: { id: actividad.id, nombre: actividad.title },
          resumenParticipantes: {
            totalRegistrados: participantes.length,
            verificados: verificados.length,
            pendientes: pendientes.length,
            rechazados: rechazados.length,
          },
          balanceFinanciero: {
            moneda: 'BOB',
            totalEfectivoEnBanco: totalVerificado,
            totalEnEsperaDeValidacion: totalPendiente,
            totalProyectado: totalVerificado + totalPendiente,
          },
          detalleVerificados: verificados.map((participante) => ({
            id: participante.id,
            nombre: `${participante.nombre} ${participante.apellido}`,
            transaccion: participante.codigoTransaccion,
            montoDeclarado: Number(participante.montoPagado),
            montoAbonadoBanco: Number(participante.montoBancoReal || participante.montoPagado),
            fecha: participante.updatedAt,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const conciliacionController = new ConciliacionController();