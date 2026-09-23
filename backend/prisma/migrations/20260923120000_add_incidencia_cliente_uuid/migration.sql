-- AlterTable
ALTER TABLE "incidencias" ADD COLUMN     "cliente_uuid" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "incidencias_solicitante_id_cliente_uuid_key" ON "incidencias"("solicitante_id", "cliente_uuid");