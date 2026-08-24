// ============================================================
//  SCRIPTS/OBFUSCATE.JS — Pipeline de Ofuscación Máxima
//  Pollos Frescos — Protección de Código Propietario
// ============================================================

const fs = require('fs');
const path = require('path');

let JavaScriptObfuscator;
try {
  JavaScriptObfuscator = require('javascript-obfuscator');
} catch (e) {
  console.error('❌ Error: javascript-obfuscator no está instalado. Ejecuta: npm install');
  process.exit(1);
}

// Configuración de máxima seguridad
const OBFUSCATION_OPTIONS = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.8,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false, // Permitir que corra sin trabas salvo que se active explícitamente
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false, // Mantener exports globales como App, Auth, DB, Utils, Router
  rotateStringArray: true,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayCallsTransformThreshold: 0.8,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.85,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

function copyDirRecursive(src, dest, excludeDirs = ['node_modules', '.git', 'dist', 'scripts']) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (excludeDirs.includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, excludeDirs);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getFilesRecursive(dir, ext = '.js') {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of list) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      results = results.concat(getFilesRecursive(fullPath, ext));
    } else if (file.name.endsWith(ext)) {
      results.push(fullPath);
    }
  }
  return results;
}

function run() {
  console.log('🔒 Iniciando proceso de protección y ofuscación de código...');
  
  // 1. Preparar directorio dist
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
  }
  
  console.log('📁 Copiando estructura del proyecto a dist/...');
  copyDirRecursive(ROOT_DIR, DIST_DIR);

  // 2. Buscar todos los archivos .js en dist/
  const jsFiles = getFilesRecursive(DIST_DIR, '.js');
  console.log(`🛡️ Ofuscando ${jsFiles.length} archivos JavaScript...`);

  let successCount = 0;
  for (const file of jsFiles) {
    const relPath = path.relative(DIST_DIR, file);
    try {
      const code = fs.readFileSync(file, 'utf8');
      const obfuscationResult = JavaScriptObfuscator.obfuscate(code, OBFUSCATION_OPTIONS);
      fs.writeFileSync(file, obfuscationResult.getObfuscatedCode(), 'utf8');
      console.log(`  ✓ Ofuscado: ${relPath}`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Error al ofuscar ${relPath}:`, err.message);
    }
  }

  console.log(`\n✅ ¡Proceso completado! ${successCount} archivos ofuscados y protegidos en: ${DIST_DIR}`);
  console.log('🚀 El directorio "dist/" contiene la versión de producción 100% protegida contra copia y robo.');
}

run();
