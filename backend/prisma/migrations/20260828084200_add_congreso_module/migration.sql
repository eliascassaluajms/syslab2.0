-- CreateEnum
CREATE TYPE "TipoParticipante" AS ENUM ('ESTUDIANTE', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "EstadoInscripcion" AS ENUM ('PRE_INSCRITO', 'PAGO_VERIFICADO', 'RECHAZADO', 'ASISTENCIA_CONFIRMADA');

-- CreateTable
CREATE TABLE "congreso_participantes" (
    "id" TEXT NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "apellido" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(150) NOT NULL,
    "telefono" VARCHAR(30) NOT NULL,
    "tipo" "TipoParticipante" NOT NULL,
    "estado" "EstadoInscripcion" NOT NULL DEFAULT 'PRE_INSCRITO',
    "codigoTransaccion" VARCHAR(100),
    "comprobanteUrl" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "congreso_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "congreso_payment_configs" (
    "id" TEXT NOT NULL,
    "banco" VARCHAR(100) NOT NULL,
    "numeroCuenta" VARCHAR(50) NOT NULL,
    "nombreReceptor" VARCHAR(150) NOT NULL,
    "nitCI" VARCHAR(30),
    "qrImagenUrl" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "congreso_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "congreso_participantes_correo_key" ON "congreso_participantes"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "congreso_participantes_codigoTransaccion_key" ON "congreso_participantes"("codigoTransaccion");
