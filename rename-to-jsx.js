// =============================================================
// HERRAMIENTA DE MIGRACIÓN ONE-TIME (ya ejecutada)
// =============================================================
// Este script renombró archivos .js con sintaxis JSX a .jsx
// durante la migración del frontend de Create React App a Vite.
// USO: `node rename-to-jsx.js` desde la raíz del frontend.
//
// ESTADO: La migración principal ya está hecha. Quedan algunos
// archivos .js que son utility/services puros (sin JSX) y no
// requieren rename. Este script se conserva como referencia y
// para casos puntuales donde se agreguen nuevos componentes .js
// por error.
//
// ÚLTIMA EJECUCIÓN: ~junio 2026 (durante sprint de migración Vite)
// =============================================================

const fs = require('fs');
const path = require('path');

// Función recursiva para escanear y renombrar componentes React
function renameJsToJsx(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);

    if (fs.statSync(fullPath).isDirectory()) {
      renameJsToJsx(fullPath); // Escanear subcarpetas
    } else if (fullPath.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Condición estricta: Si el archivo contiene etiquetas de cierre JSX o componentes React
      if (content.includes('/>') || content.includes('</') || content.match(/<[A-Z]/)) {
        const newPath = fullPath.replace(/\.js$/, '.jsx');
        fs.renameSync(fullPath, newPath);
        console.log(`[MIGRACIÓN VITE] Renombrado exitoso: ${fullPath} -> ${newPath}`);
      }
    }
  }
}

console.log("Iniciando escaneo masivo de archivos JS con sintaxis JSX en /src...");
renameJsToJsx(path.join(__dirname, 'src'));
console.log("¡Migración de extensiones a Vite completada con éxito!");