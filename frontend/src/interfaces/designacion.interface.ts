export interface DocenteResumen {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
}

export interface MateriaResumen {
  id: number;
  codigo: string;
  nombre: string;
  tipoPeriodo: string;
}

export interface DesignacionMateria {
  id: number;
  docenteId: number;
  materiaId: number;
  grupo: number;
  gestion: number;
  periodo: 'ANUAL' | 'SEMESTRE_1' | 'SEMESTRE_2';
  activo: boolean;
  docente?: DocenteResumen;
  materia?: MateriaResumen;
}

export interface CrearDesignacionDTO {
  docenteId: number;
  materiaId: number;
  grupo: number;
  gestion: number;
  tipoPeriodo: string;
}
