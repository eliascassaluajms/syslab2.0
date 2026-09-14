import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service.js';

const service = new ActivityService();

export class ActivityController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const soloActivos = req.query.soloActivos === 'true';

      // 1. Petición pública (Ej: Landing Page sin Token)
      if (!req.user) {
        const result = await service.listar(soloActivos);
        return res.status(200).json(result);
      }

      // 2. Petición autenticada (Panel de Reportes/Admin)
      const careerScope = (req.user?.carreras ?? []).map((career: any) => String(career)).join(',');
      const role = (req.user as any)?.role ?? req.user?.rol ?? '';

      // Si es un rol administrativo global o no tiene carreras asignadas, evitamos el filtro restrictivo estricto
      const esGlobal = ['ADMIN', 'ADMINISTRADOR', 'ADMIN_GLOBAL'].some(r => role.toUpperCase().includes(r));
      const scopeFinal = (careerScope === '' || esGlobal) ? undefined : careerScope;

      const result = await service.getActivities(scopeFinal, role, soloActivos);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async cambiarEstado(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { activo } = req.body;
      if (typeof activo !== 'boolean') {
        return res.status(400).json({ error: 'El parámetro "activo" debe ser un valor booleano (true o false).' });
      }
      const result = await service.cambiarEstado(id, activo);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const selectedCareer = req.body.carreraId ?? req.body.carrera_id ?? req.body.id_carrera ?? null;
      const selectedLab = req.body.labId ?? req.body.lab_id ?? req.body.id_laboratorio ?? null;
      const assignedOperator = req.body.operadorId ?? req.body.operador_id ?? req.body.responsableId ?? null;

      const userCarreras: any[] = req.user?.carreras || (req.user as any)?.carrera_ids || [];
      const rawRoles = (req.user as any)?.roles || (req.user as any)?.role || (req.user as any)?.rol || [];
      const userRoles: string[] = Array.isArray(rawRoles) 
        ? rawRoles.map((r: any) => typeof r === 'string' ? r : (r?.nombre || r?.name || ''))
        : [typeof rawRoles === 'string' ? rawRoles : (rawRoles?.nombre || rawRoles?.name || '')];

      const userRoleId = (req.user as any)?.roleId ?? (req.user as any)?.rol_id ?? null;
      const usuarioId = req.user?.id ?? (req.user as any)?.usuario_id;

      const userCarrerasStr = userCarreras.map((c) => String(c));
      const userRolesUpper = userRoles.map((r) => String(r).toUpperCase().trim());

      const ROLES_AUTORIZADOS = ['ADMIN', 'ADMINISTRADOR', 'SUPERADMIN', 'DIRECTOR', 'JEFE', 'DECANO', 'VICEDECANO'];
      const esRolAutorizado = userRolesUpper.some((userRole) => ROLES_AUTORIZADOS.some((k) => userRole.includes(k)));
      const selectedCareerStr = selectedCareer !== null ? String(selectedCareer) : null;
      const tieneAccesoCarrera = selectedCareerStr ? userCarrerasStr.includes(selectedCareerStr) : false;

      if (!esRolAutorizado && selectedCareerStr && !tieneAccesoCarrera) {
        return res.status(403).json({ error: 'No tienes autorización para crear actividades fuera de tu ámbito de carrera.' });
      }

      let careerScope: string[];
      if (selectedCareerStr) {
        careerScope = [selectedCareerStr];
      } else {
        careerScope = userCarrerasStr;
      }

      const primaryCareerId = selectedCareer ? Number(selectedCareer) : (userCarreras[0] ? Number(userCarreras[0]) : null);
      const payload = {
        ...req.body,
        usuarioId: usuarioId ? Number(usuarioId) : null,
        creadoPorId: usuarioId ? Number(usuarioId) : null,
        operadorId: assignedOperator ? Number(assignedOperator) : (usuarioId ? Number(usuarioId) : null),
        carreraId: primaryCareerId,
        labId: selectedLab ? Number(selectedLab) : null,
      };

      const mainRole = userRolesUpper[0] || String(userRoleId || 'USUARIO');
      const result = await service.createActivity(payload, careerScope.join(','), mainRole);
      res.status(201).json(result);
    } catch (error: any) {
      next(error);
    }
  }

  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await service.getActivityById(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const title = req.body.title ?? req.body.nombre;
      const description = req.body.description !== undefined ? req.body.description : req.body.descripcion;
      const careerScope = req.body.careerScope !== undefined ? String(req.body.careerScope) : (req.body.carreraId ? String(req.body.carreraId) : undefined);
      const labId = req.body.labId !== undefined ? Number(req.body.labId) : (req.body.id_laboratorio ? Number(req.body.id_laboratorio) : undefined);
      const bannerUrl = req.body.bannerUrl !== undefined ? req.body.bannerUrl : req.body.banner_url;
      const fechaInicio = req.body.fechaInicio !== undefined ? (req.body.fechaInicio ? new Date(req.body.fechaInicio) : null) : undefined;
      const fechaFin = req.body.fechaFin !== undefined ? (req.body.fechaFin ? new Date(req.body.fechaFin) : null) : undefined;
      const activo = typeof req.body.activo === 'boolean' ? req.body.activo : undefined;

      const updateData: any = {};
      if (title !== undefined) updateData.title = String(title).trim();
      if (description !== undefined) updateData.description = description ? String(description).trim() : null;
      if (careerScope !== undefined) updateData.careerScope = String(careerScope).trim();
      if (labId !== undefined && !isNaN(labId)) updateData.labId = labId;
      if (bannerUrl !== undefined) updateData.bannerUrl = bannerUrl ? String(bannerUrl).trim() : null;
      if (fechaInicio !== undefined) updateData.fechaInicio = fechaInicio;
      if (fechaFin !== undefined) updateData.fechaFin = fechaFin;
      if (activo !== undefined) updateData.activo = activo;

      const result = await service.updateActivity(id, updateData);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await service.deleteActivity(id);
      res.status(200).json({ status: 'success', message: 'Actividad eliminada correctamente.' });
    } catch (error) {
      next(error);
    }
  }
}