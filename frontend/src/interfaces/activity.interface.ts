export interface Activity {
  id: string;
  title: string;
  description?: string;
  careerScope: string;
  bannerUrl?: string;
  fechaInicio?: string;
  fechaFin?: string;
  activo?: boolean;
  labId: number;
  lab?: {
    id: number;
    codigo: string;
    nombre: string;
  };
}
