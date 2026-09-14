#!/bin/bash
set -e

echo "======================================================="
echo "   Despliegue de Frontend y Nginx - SysLab 2.0         "
echo "======================================================="

# 1. Verificar permisos de superusuario
if [ "$EUID" -ne 0 ]; then
  echo "Error: Este script debe ejecutarse con sudo."
  echo "Uso: sudo ./deploy_frontend.sh"
  exit 1
fi

# 2. Copiar archivos compilados del frontend a /var/www/syslab
echo "[1/3] Copiando archivos de frontend/dist a /var/www/syslab/..."
cp -rf /home/eliasdev/syslab2.0/frontend/dist/* /var/www/syslab/
chown -R www-data:www-data /var/www/syslab
chmod -R 755 /var/www/syslab

# 3. Actualizar configuración de Nginx con soporte para /comprobantes
echo "[2/3] Configurando Nginx para servir comprobantes y SPA..."
cp /home/eliasdev/syslab2.0/nginx-syslab.conf /etc/nginx/sites-available/syslab
nginx -t

# 4. Recargar Nginx
echo "[3/3] Recargando Nginx..."
systemctl reload nginx

echo "======================================================="
echo "¡Despliegue exitoso! Recarga tu navegador con Ctrl+Shift+R"
echo "======================================================="
