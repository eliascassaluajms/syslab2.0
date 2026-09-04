-- CreateEnum
CREATE TYPE "EstadoInscripcionMateria" AS ENUM ('ACTIVA', 'RETIRADA', 'ANULADA');

-- CreateTable
CREATE TABLE "inscripciones_materia" (
    "id" SERIAL NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "grupo" INTEGER NOT NULL DEFAULT 1,
    "semestre" INTEGER NOT NULL,
    "gestion" INTEGER NOT NULL,
    "estado" "EstadoInscripcionMateria" NOT NULL DEFAULT 'ACTIVA',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inscripciones_materia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inscripciones_materia_estudiante_id_materia_id_grupo_semestre_gestion_key"
    ON "inscripciones_materia"("estudiante_id", "materia_id", "grupo", "semestre", "gestion");

CREATE INDEX "inscripciones_materia_estudiante_id_materia_id_estado_idx"
    ON "inscripciones_materia"("estudiante_id", "materia_id", "estado");

-- AddForeignKey
ALTER TABLE "inscripciones_materia"
    ADD CONSTRAINT "inscripciones_materia_estudiante_id_fkey"
    FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inscripciones_materia"
    ADD CONSTRAINT "inscripciones_materia_materia_id_fkey"
    FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;
