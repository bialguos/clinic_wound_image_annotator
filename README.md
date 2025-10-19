# Clinic Wound Image Annotator

Aplicación web para gestionar registros de heridas de pacientes con capacidades de anotación de imágenes.

## Descripción

Esta es una aplicación desarrollada con React + TypeScript + Vite que permite a profesionales de la salud documentar el cuidado de heridas mediante imágenes con anotaciones de texto, transformaciones y dibujos.

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 16 o superior)
- **npm** (viene incluido con Node.js)
- **Git** (para control de versiones y despliegue)
- Una cuenta de **GitHub** (para alojar el repositorio y desplegar en GitHub Pages)

## Instalación

1. Abre una terminal o línea de comandos

2. Navega hasta la carpeta del proyecto:
   ```bash
   cd "C:\Users\oalvarez\Documents\Mis Documentos\UCA\Documentos Funcionales\ImageEditor\clinic_wound_image_annotator"
   ```

3. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```

## Desarrollo Local

Para ejecutar la aplicación en tu computadora local:

```bash
npm run dev
```

Esto iniciará un servidor de desarrollo. Abre tu navegador y ve a la dirección que aparece en la terminal (normalmente `http://localhost:5173`).

## Despliegue en GitHub Pages

### Opción 1: Despliegue Automático (Recomendado)

Ejecuta uno de estos comandos según tu sistema operativo:

**En Windows:**
```bash
deploy.bat
```

Simplemente haz doble clic en el archivo `deploy.bat` o ejecútalo desde la terminal.

**En Mac/Linux:**
```bash
./deploy.sh
```

Este script automáticamente ejecutará todos los pasos necesarios para desplegar tu aplicación en GitHub Pages.

### Opción 2: Despliegue Manual (Paso a Paso)

Si prefieres ejecutar cada paso manualmente, sigue estos pasos **uno por uno**:

### Paso 1: Construir la aplicación para producción

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm run build
```

Este comando creará una carpeta llamada `dist` con todos los archivos optimizados para producción.

### Paso 2: Entrar a la carpeta dist

```bash
cd dist
```

### Paso 3: Inicializar Git en la carpeta dist

```bash
git init
```

Este comando crea un nuevo repositorio Git dentro de la carpeta `dist`.

### Paso 4: Agregar todos los archivos al repositorio

```bash
git add -A
```

Esto prepara todos los archivos de la carpeta `dist` para ser incluidos en el commit.

### Paso 5: Crear el commit

```bash
git commit -m "Deploy"
```

Esto guarda los archivos en el repositorio local con el mensaje "Deploy".

### Paso 6: Renombrar la rama a gh-pages

```bash
git branch -M gh-pages
```

GitHub Pages busca los archivos en una rama llamada `gh-pages`, por eso renombramos la rama.

### Paso 7: Conectar con el repositorio de GitHub

```bash
git remote add origin https://github.com/bialguos/clinic_wound_image_annotator.git
```

Esto conecta tu repositorio local con el repositorio en GitHub.

### Paso 8: Subir los archivos a GitHub

```bash
git push -f origin gh-pages
```

Este comando sube todos los archivos a la rama `gh-pages` en GitHub. La opción `-f` (force) sobrescribe cualquier versión anterior.

### Paso 9: Volver a la carpeta principal del proyecto

```bash
cd ..
```

Esto te regresa a la carpeta raíz del proyecto.

### Paso 10: Verificar el despliegue

Después de unos minutos (1-3 minutos), tu aplicación estará disponible en:

```
https://bialguos.github.io/clinic_wound_image_annotator/
```

## Despliegues Futuros

### Método Rápido
Cada vez que quieras actualizar la aplicación, simplemente ejecuta:

**Windows:**
```bash
deploy.bat
```

**Mac/Linux:**
```bash
./deploy.sh
```

### Método Manual
Si prefieres hacerlo manualmente, repite estos pasos:

1. `npm run build`
2. `cd dist`
3. `git add -A`
4. `git commit -m "Deploy"`
5. `git push -f origin gh-pages`
6. `cd ..`

**Nota:** No necesitas volver a ejecutar `git init`, `git branch -M gh-pages` ni `git remote add origin` porque ya están configurados.

## Solución de Problemas Comunes

### Error: "fatal: not a git repository"

Si ves este error después de `cd dist`, significa que necesitas inicializar Git nuevamente:
```bash
git init
git branch -M gh-pages
git remote add origin https://github.com/bialguos/clinic_wound_image_annotator.git
```

### Error: "Permission denied" o "Authentication failed"

Necesitas configurar tus credenciales de GitHub. Sigue las instrucciones que aparecen en la terminal o configura un Personal Access Token en GitHub.

### La aplicación no se actualiza en el navegador

- Espera 2-3 minutos después del push
- Borra el caché del navegador (Ctrl + F5 o Cmd + Shift + R)
- Verifica que el push fue exitoso visitando: `https://github.com/bialguos/clinic_wound_image_annotator/tree/gh-pages`

## Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Previsualiza la versión de producción localmente
- `npm run lint` - Ejecuta el linter para verificar el código
- `npm run typecheck` - Verifica los tipos de TypeScript

## Tecnologías Utilizadas

- React 18
- TypeScript
- Vite
- Tailwind CSS
- lucide-react (iconos)
- localStorage (almacenamiento de datos)

## Licencia

Este proyecto es de uso interno para propósitos educativos y de investigación.
