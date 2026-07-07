-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(255),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "codigo" VARCHAR(100) NOT NULL,
    "descripcion" VARCHAR(255),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permisos" (
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,

    CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "rol_id" INTEGER NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facultades" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "sigla" VARCHAR(20) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "facultades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carreras" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(150) NOT NULL,
    "facultad_id" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "carreras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_facultades" (
    "usuario_id" INTEGER NOT NULL,
    "facultad_id" INTEGER NOT NULL,

    CONSTRAINT "usuario_facultades_pkey" PRIMARY KEY ("usuario_id","facultad_id")
);

-- CreateTable
CREATE TABLE "usuario_carreras" (
    "usuario_id" INTEGER NOT NULL,
    "carrera_id" INTEGER NOT NULL,

    CONSTRAINT "usuario_carreras_pkey" PRIMARY KEY ("usuario_id","carrera_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "facultades_nombre_key" ON "facultades"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "facultades_sigla_key" ON "facultades"("sigla");

-- CreateIndex
CREATE UNIQUE INDEX "carreras_nombre_key" ON "carreras"("nombre");

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permisos" ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carreras" ADD CONSTRAINT "carreras_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_facultades" ADD CONSTRAINT "usuario_facultades_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_facultades" ADD CONSTRAINT "usuario_facultades_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_carreras" ADD CONSTRAINT "usuario_carreras_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_carreras" ADD CONSTRAINT "usuario_carreras_carrera_id_fkey" FOREIGN KEY ("carrera_id") REFERENCES "carreras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
