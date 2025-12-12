#!/bin/bash

# Script de despliegue para Conteos-Frontend

echo "🚀 Iniciando despliegue de Conteos-Frontend..."

# Navega a la carpeta del frontend
cd /var/www/conteos/conteos-frontend || { echo "❌ ERROR: No se pudo acceder a la carpeta"; exit 1; }

# Detiene ejecución si hay un error
set -e

# 1. Actualiza el código desde GitHub
echo "📥 git pull..."
# Ajusta la rama si es distinta a 'main'
git pull origin main

# 2. Instala dependencias (solo si package.json ha cambiado)
echo "📦 npm install..."
npm install

# 3. Construye el frontend (genera la carpeta 'dist' o 'build' según tu configuración)
echo "🔨 npm run build..."
# Asegúrate de que .env.production ya esté configurado con la API correcta
npm run build

# 4. Elimina la carpeta de archivos estáticos anterior y mueve el nuevo build
# Si tu build genera 'dist', lo renombramos a 'build' como espera Apache
echo "🗂️ Moviendo 'dist' a 'build'..."
rm -rf build
mv dist build

# 5. Reinicia Apache para limpiar caché y servir los archivos nuevos
echo "🔄 Reiniciando Apache..."
sudo systemctl reload apache2

echo "✅ Despliegue de Conteos-Frontend completado con éxito!"
