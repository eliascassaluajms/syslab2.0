-- CreateTable
CREATE TABLE "asignaciones_ambito" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "facultad_id" INTEGER,
    "carrera_id" INTEGER,

    CONSTRAINT "asignaciones_ambito_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_ambito_usuario_id_rol_id_facultad_id_carrera_i_key" ON "asignaciones_ambito"("usuario_id", "rol_id", "facultad_id", "carrera_id");

-- AddForeignKey
ALTER TABLE "asignaciones_ambito" ADD CONSTRAINT "asignaciones_ambito_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ambito" ADD CONSTRAINT "asignaciones_ambito_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ambito" ADD CONSTRAINT "asignaciones_ambito_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones_ambito" ADD CONSTRAINT "asignaciones_ambito_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
