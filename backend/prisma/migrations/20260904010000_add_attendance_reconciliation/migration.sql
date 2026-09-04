-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "OrigenMarcado" AS ENUM ('QR_ESTUDIANTE', 'PIN_ESTUDIANTE', 'MANUAL_DOCENTE', 'SISTEMA_FALTA_AUTOMATICA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE "EstadoAsistencia" AS ENUM ('PRESENTE', 'ATRASO', 'FALTA', 'LICENCIA');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Session reconciliation fields
ALTER TABLE "SesionBitacora"
    ADD COLUMN "grupo" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "semestre" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "gestion" INTEGER NOT NULL DEFAULT 2026,
    ADD COLUMN "listaConfirmada" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "fechaConfirmacionLista" TIMESTAMP(3);

-- Auditable attendance fields
ALTER TABLE "AsistenciaEstudiante"
    ALTER COLUMN "fechaHora" DROP NOT NULL,
    ALTER COLUMN "fechaHora" DROP DEFAULT,
    ADD COLUMN "equipoId" INTEGER,
    ADD COLUMN "estado" "EstadoAsistencia" NOT NULL DEFAULT 'PRESENTE',
    ADD COLUMN "origen" "OrigenMarcado" NOT NULL DEFAULT 'QR_ESTUDIANTE',
    ADD COLUMN "justificativo" VARCHAR(255),
    ADD COLUMN "modificadoPorId" INTEGER;

CREATE INDEX "asistencias_estudiante_sesionBitacoraId_estado_idx"
    ON "AsistenciaEstudiante"("sesionBitacoraId", "estado");

ALTER TABLE "AsistenciaEstudiante"
    ADD CONSTRAINT "asistencias_estudiante_equipoId_fkey"
    FOREIGN KEY ("equipoId") REFERENCES "equipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AsistenciaEstudiante"
    ADD CONSTRAINT "asistencias_estudiante_modificadoPorId_fkey"
    FOREIGN KEY ("modificadoPorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
