/*
  Warnings:

  - You are about to drop the `usuario_carreras` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuario_facultades` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `apellido` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('OPERATIVO', 'EN_MANTENIMIENTO', 'CON_FALLA', 'FUERA_DE_SERVICIO');

-- CreateEnum
CREATE TYPE "EstadoIncidencia" AS ENUM ('REPORTADA', 'EN_DIAGNOSTICO', 'EN_REPARACION', 'RESUELTA', 'CERRADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadIncidencia" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "TipoCategoriaEvento" AS ENUM ('ACADEMICO', 'NO_ACADEMICO');

-- DropForeignKey
ALTER TABLE "asignaciones_ambito" DROP CONSTRAINT "asignaciones_ambito_carrera_id_fkey";

-- DropForeignKey
ALTER TABLE "asignaciones_ambito" DROP CONSTRAINT "asignaciones_ambito_facultad_id_fkey";

-- DropForeignKey
ALTER TABLE "usuario_carreras" DROP CONSTRAINT "usuario_carreras_carrera_id_fkey";

-- DropForeignKey
ALTER TABLE "usuario_carreras" DROP CONSTRAINT "usuario_carreras_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "usuario_facultades" DROP CONSTRAINT "usuario_facultades_facultad_id_fkey";

-- DropForeignKey
ALTER TABLE "usuario_facultades" DROP CONSTRAINT "usuario_facultades_usuario_id_fkey";

-- DropForeignKey
ALTER TABLE "usuarios" DROP CONSTRAINT "usuarios_rol_id_fkey";

-- AlterTable
ALTER TABLE "carreras" ADD COLUMN     "descripcion" TEXT;

-- AlterTable
ALTER TABLE "roles" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "apellido" TEXT NOT NULL,
ADD COLUMN     "es_global" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "rol_id" DROP NOT NULL;

-- DropTable
DROP TABLE "usuario_carreras";

-- DropTable
DROP TABLE "usuario_facultades";

-- CreateTable
CREATE TABLE "planes_estudio" (
    "id" SERIAL NOT NULL,
    "carrera_id" INTEGER NOT NULL,
    "gestion" INTEGER NOT NULL,
    "descripcion" VARCHAR(100),
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "planes_estudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "plan_id" INTEGER NOT NULL,
    "tipo_periodo" TEXT NOT NULL DEFAULT 'Semestral',
    "semestre" INTEGER NOT NULL,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratorios" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "ubicacion" VARCHAR(255),
    "capacidad" INTEGER NOT NULL DEFAULT 0,
    "descripcion" VARCHAR(255),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    "facultad_id" INTEGER NOT NULL,
    "carrera_id" INTEGER,

    CONSTRAINT "laboratorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "horarios" (
    "id" SERIAL NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "docente_id" INTEGER NOT NULL,
    "dia_semana" TEXT NOT NULL,
    "hora_inicio" VARCHAR(10) NOT NULL,
    "hora_fin" VARCHAR(10) NOT NULL,
    "semestre" INTEGER NOT NULL,
    "gestion" INTEGER NOT NULL,

    CONSTRAINT "horarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "codigo_inventario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "num_serie" TEXT,
    "especificaciones" JSONB,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'OPERATIVO',
    "laboratorio_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidencias" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "prioridad" "PrioridadIncidencia" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoIncidencia" NOT NULL DEFAULT 'REPORTADA',
    "equipo_id" INTEGER NOT NULL,
    "reportado_por_id" INTEGER NOT NULL,
    "asignado_a_id" INTEGER,
    "solucion" TEXT,
    "fecha_resolucion" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "incidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_eventos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "tipo" "TipoCategoriaEvento" NOT NULL DEFAULT 'ACADEMICO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "carrera_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "career_scope" TEXT NOT NULL,
    "lab_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "materias_codigo_key" ON "materias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "laboratorios_codigo_key" ON "laboratorios"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_codigo_inventario_key" ON "equipos"("codigo_inventario");

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_codigo_key" ON "incidencias"("codigo");

-- CreateIndex
CREATE INDEX "categorias_eventos_carrera_id_idx" ON "categorias_eventos"("carrera_id");

-- CreateIndex
CREATE INDEX "activities_career_scope_idx" ON "activities"("career_scope");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ambito" ADD CONSTRAINT "asignaciones_ambito_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ambito" ADD CONSTRAINT "asignaciones_ambito_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planes_estudio" ADD CONSTRAINT "planes_estudio_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "planes_estudio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratorios" ADD CONSTRAINT "laboratorios_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratorios" ADD CONSTRAINT "laboratorios_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios" ADD CONSTRAINT "horarios_docente_id_fkey" FOREIGN KEY ("docente_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_reportado_por_id_fkey" FOREIGN KEY ("reportado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias" ADD CONSTRAINT "incidencias_asignado_a_id_fkey" FOREIGN KEY ("asignado_a_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_eventos" ADD CONSTRAINT "categorias_eventos_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_lab_id_fkey" FOREIGN KEY ("lab_id") REFERENCES "laboratorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
