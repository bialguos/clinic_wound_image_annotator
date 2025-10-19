#!/bin/bash

echo "================================"
echo " Desplegando a GitHub Pages"
echo "================================"
echo ""

echo "[1/6] Construyendo la aplicación..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Falló la construcción"
    exit 1
fi
echo ""

echo "[2/6] Entrando a la carpeta dist..."
cd dist
echo ""

echo "[3/6] Inicializando repositorio Git..."
git init
echo ""

echo "[4/6] Agregando archivos..."
git add -A
echo ""

echo "[5/6] Creando commit..."
git commit -m "Deploy"
echo ""

echo "[6/6] Configurando y subiendo a GitHub..."
git branch -M gh-pages
git remote add origin https://github.com/bialguos/clinic_wound_image_annotator.git 2>/dev/null || true
git push -f origin gh-pages
echo ""

echo "Regresando a la carpeta principal..."
cd ..
echo ""

echo "================================"
echo " Despliegue completado!"
echo " URL: https://bialguos.github.io/clinic_wound_image_annotator/"
echo "================================"
