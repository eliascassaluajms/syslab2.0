import { Prisma } from '@prisma/client';

export type ActivityGetPayload = Prisma.ActivityGetPayload<{
  include: { lab: true };
}>;

export interface CreateActivityDTO {
  title: string;
  description?: string;
  careerScope: string;
  labId: number;
}

export interface UpdateActivityDTO extends Partial<CreateActivityDTO> {}
