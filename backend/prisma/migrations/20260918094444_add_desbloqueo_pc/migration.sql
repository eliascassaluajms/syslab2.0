-- CreateEnum
CREATE TYPE "EstadoDesafio" AS ENUM ('ESPERANDO', 'LIBERADO', 'EXPIRADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoUsoEquipo" AS ENUM ('ACTIVO', 'CERRADO');

-- AlterEnum
ALTER TYPE "OrigenMarcado" ADD VALUE 'DESBLOQUEO_PC';

-- CreateTable
CREATE TABLE "dispositivos_escritorio" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "device_token" VARCHAR(255) NOT NULL,
    "nombre_equipo" VARCHAR(150),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultima_conexion" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispositivos_escritorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "desafios_desbloqueo" (
    "id" SERIAL NOT NULL,
    "dispositivo_id" INTEGER NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "codigo" VARCHAR(4) NOT NULL,
    "estado" "EstadoDesafio" NOT NULL DEFAULT 'ESPERANDO',
    "intentos" INTEGER NOT NULL DEFAULT 0,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "liberado_por_id" INTEGER,
    "liberado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "desafios_desbloqueo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usos_equipos" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "estudiante_id" INTEGER NOT NULL,
    "sesion_bitacora_id" INTEGER,
    "desafio_id" INTEGER,
    "estado" "EstadoUsoEquipo" NOT NULL DEFAULT 'ACTIVO',
    "fecha_hora_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hora_fin" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usos_equipos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_escritorio_equipo_id_key" ON "dispositivos_escritorio"("equipo_id");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivos_escritorio_device_token_key" ON "dispositivos_escritorio"("device_token");

-- CreateIndex
CREATE INDEX "dispositivos_escritorio_laboratorio_id_idx" ON "dispositivos_escritorio"("laboratorio_id");

-- CreateIndex
CREATE INDEX "desafios_desbloqueo_equipo_id_estado_idx" ON "desafios_desbloqueo"("equipo_id", "estado");

-- CreateIndex
CREATE INDEX "desafios_desbloqueo_laboratorio_id_estado_idx" ON "desafios_desbloqueo"("laboratorio_id", "estado");

-- CreateIndex
CREATE INDEX "desafios_desbloqueo_codigo_estado_idx" ON "desafios_desbloqueo"("codigo", "estado");

-- CreateIndex
CREATE UNIQUE INDEX "usos_equipos_desafio_id_key" ON "usos_equipos"("desafio_id");

-- CreateIndex
CREATE INDEX "usos_equipos_equipo_id_estado_idx" ON "usos_equipos"("equipo_id", "estado");

-- CreateIndex
CREATE INDEX "usos_equipos_estudiante_id_estado_idx" ON "usos_equipos"("estudiante_id", "estado");

-- CreateIndex
CREATE INDEX "usos_equipos_sesion_bitacora_id_idx" ON "usos_equipos"("sesion_bitacora_id");

-- AddForeignKey
ALTER TABLE "dispositivos_escritorio" ADD CONSTRAINT "dispositivos_escritorio_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivos_escritorio" ADD CONSTRAINT "dispositivos_escritorio_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafios_desbloqueo" ADD CONSTRAINT "desafios_desbloqueo_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivos_escritorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafios_desbloqueo" ADD CONSTRAINT "desafios_desbloqueo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafios_desbloqueo" ADD CONSTRAINT "desafios_desbloqueo_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "desafios_desbloqueo" ADD CONSTRAINT "desafios_desbloqueo_liberado_por_id_fkey" FOREIGN KEY ("liberado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usos_equipos" ADD CONSTRAINT "usos_equipos_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usos_equipos" ADD CONSTRAINT "usos_equipos_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usos_equipos" ADD CONSTRAINT "usos_equipos_estudiante_id_fkey" FOREIGN KEY ("estudiante_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usos_equipos" ADD CONSTRAINT "usos_equipos_sesion_bitacora_id_fkey" FOREIGN KEY ("sesion_bitacora_id") REFERENCES "SesionBitacora"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usos_equipos" ADD CONSTRAINT "usos_equipos_desafio_id_fkey" FOREIGN KEY ("desafio_id") REFERENCES "desafios_desbloqueo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

