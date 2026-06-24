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