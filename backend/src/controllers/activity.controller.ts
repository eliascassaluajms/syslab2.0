import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service.js';

const service = new ActivityService();

export class ActivityController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const careerScope = (req.user?.carreras ?? []).map((career) => String(career));
      const role = (req.user as any)?.role ?? req.user?.rol ?? '';

      const result = await service.getActivities(careerScope.join(','), role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Desestructuración y normalización de parámetros recibidos
      const selectedCareer = req.body.carreraId ?? req.body.carrera_id ?? req.body.id_carrera ?? null;
      const selectedLab = req.body.labId ?? req.body.lab_id ?? req.body.id_laboratorio ?? null;
      const assignedOperator = req.body.operadorId ?? req.body.operador_id ?? req.body.responsableId ?? null;

      // 2. Extraer contexto del usuario autenticado (JWT / Sesión)
      const userCarreras: any[] = req.user?.carreras || (req.user as any)?.carrera_ids || [];
      const userLabs: any[] = (req.user as any)?.laboratorios || (req.user as any)?.lab_ids || [];
      
      // Extracción robusta de roles (Strings y Objetos que puedan venir en req.user)
      const rawRoles = (req.user as any)?.roles || (req.user as any)?.role || (req.user as any)?.rol || [];
      const userRoles: string[] = Array.isArray(rawRoles) 
        ? rawRoles.map((r: any) => typeof r === 'string' ? r : (r?.nombre || r?.name || ''))
        : [typeof rawRoles === 'string' ? rawRoles : (rawRoles?.nombre || rawRoles?.name || '')];

      const userRoleId = (req.user as any)?.roleId ?? (req.user as any)?.rol_id ?? (req.user as any)?.id_rol ?? null;
      const usuarioId = req.user?.id ?? (req.user as any)?.usuario_id;

      // Arrays de comparación segura en string y mayúsculas
      const userCarrerasStr = userCarreras.map((c) => String(c));
      const userRolesUpper = userRoles.map((r) => String(r).toUpperCase().trim());

      // 3. Definición Amplia de Roles Autorizados (Administradores, Jefes de Lab, Directores)
      const ROLES_AUTORIZADOS_PALABRAS_CLAVE = [
        'ADMIN',
        'ADMINISTRADOR',
        'SUPERADMIN',
        'DIRECTOR',
        'DIRECTOR DE CARRERA',
        'JEFE',
        'JEFE_LABORATORIO',
        'JEFE DE LABORATORIO',
        'JEFE_LAB',
        'DECANO',
        'VICEDECANO'
      ];

      // Verificación si el rol del usuario contiene alguna de las palabras clave gerenciales/administrativas
      const esRolAutorizado = userRolesUpper.some((userRole) => 
        ROLES_AUTORIZADOS_PALABRAS_CLAVE.some((keyword) => userRole.includes(keyword))
      );

      const selectedCareerStr = selectedCareer !== null ? String(selectedCareer) : null;
      const tieneAccesoCarrera = selectedCareerStr ? userCarrerasStr.includes(selectedCareerStr) : false;

      // 4. Validación de Ámbito: Si NO es un rol autorizado Y la carrera no le pertenece -> RECHAZAR
      if (!esRolAutorizado && selectedCareerStr && !tieneAccesoCarrera) {
        return res.status(403).json({
          error: 'No tienes autorización para crear actividades fuera de tu ámbito de carrera.'
        });
      }

      // 5. Determinar el ámbito definitivo para la consulta de persistencia
      let careerScope: string[];
      if (selectedCareerStr && esRolAutorizado) {
        // Si es admin/jefe/director, puede operar en la carrera que seleccione en el formulario
        careerScope = [selectedCareerStr];
      } else if (selectedCareerStr) {
        careerScope = [selectedCareerStr];
      } else {
        careerScope = userCarrerasStr;
      }

      // 6. Sanitización del Payload Final
      const primaryCareerId = selectedCareer ? Number(selectedCareer) : (userCarreras[0] ? Number(userCarreras[0]) : null);

      const payload = {
        ...req.body,
        usuarioId: usuarioId ? Number(usuarioId) : null,
        usuario_id: usuarioId ? Number(usuarioId) : null,
        creadoPorId: usuarioId ? Number(usuarioId) : null,
        operadorId: assignedOperator ? Number(assignedOperator) : (usuarioId ? Number(usuarioId) : null),
        carreraId: primaryCareerId,
        carrera_id: primaryCareerId,
        labId: selectedLab ? Number(selectedLab) : null,
        lab_id: selectedLab ? Number(selectedLab) : null,
      };

      const mainRole = userRolesUpper[0] || String(userRoleId || 'USUARIO');

      const result = await service.createActivity(payload, careerScope.join(','), mainRole);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('❌ [ActivityController.crear] Error:', error?.stack || error);
      next(error);
    }
  }
}