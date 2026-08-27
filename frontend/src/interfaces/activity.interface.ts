export interface Activity {
  id: string;
  title: string;
  description?: string;
  careerScope: string;
  labId: number;
  lab?: {
    id: number;
    codigo: string;
    nombre: string;
  };
}
