-- CreateEnum
CREATE TYPE "TipoIncidencia" AS ENUM ('HARDWARE', 'SOFTWARE', 'RED', 'INFRAESTRUCTURA');

-- CreateEnum
CREATE TYPE "CategoriaEquipoIncidencia" AS ENUM ('PC', 'PROYECTOR', 'AIRE_ACONDICIONADO', 'RED_INTERNET', 'PERIFERICO', 'SOFTWARE', 'OTRO');

-- AlterEnum
BEGIN;
CREATE TYPE "EstadoIncidencia_new" AS ENUM ('PENDIENTE', 'EN_REVISION', 'EN_PROCESO', 'RESUELTO', 'DESCARTADO');
ALTER TABLE "public"."incidencias" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "incidencias" ALTER COLUMN "estado" TYPE "EstadoIncidencia_new" USING ("estado"::text::"EstadoIncidencia_new");
ALTER TYPE "EstadoIncidencia" RENAME TO "EstadoIncidencia_old";
ALTER TYPE "EstadoIncidencia_new" RENAME TO "EstadoIncidencia";
DROP TYPE "public"."EstadoIncidencia_old";
ALTER TABLE "incidencias" ALTER COLUMN "estado" SET DEFAULT 'PENDIENTE';
COMMIT;

-- AlterTable: añadir columnas nuevas con folio nullable primero
ALTER TABLE "incidencias" ADD COLUMN "categoria_equipo" "CategoriaEquipoIncidencia" NOT NULL DEFAULT 'PC',
ADD COLUMN "evidencia_url" TEXT,
ADD COLUMN "folio" VARCHAR(30),
ADD COLUMN "tipo" "TipoIncidencia" NOT NULL DEFAULT 'HARDWARE';

-- Rellenar folio de incidencias existentes (1 fila inicial)
UPDATE "incidencias" SET "folio" = 'INC-' || to_char("fecha_reporte", 'YYYY') || '-' || lpad(CAST("id" AS TEXT), 4, '0') WHERE "folio" IS NULL;

-- Establecer folio como NOT NULL
ALTER TABLE "incidencias" ALTER COLUMN "folio" SET NOT NULL;

-- CreateTable
CREATE TABLE "incidencias_notas" (
    "id" SERIAL NOT NULL,
    "incidencia_id" INTEGER NOT NULL,
    "autor_id" INTEGER,
    "mensaje" TEXT NOT NULL,
    "es_sistema" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "incidencias_notas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_folio_key" ON "incidencias"("folio");

-- AddForeignKey
ALTER TABLE "incidencias_notas" ADD CONSTRAINT "incidencias_notas_incidencia_id_fkey" FOREIGN KEY ("incidencia_id") REFERENCES "incidencias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidencias_notas" ADD CONSTRAINT "incidencias_notas_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;