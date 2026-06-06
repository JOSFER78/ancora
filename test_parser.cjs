const fs = require('fs');
const path = require('path');
const { transformSync } = require('esbuild');

try {
  const filePath = path.join(__dirname, 'src', 'views', 'AgentesView.jsx');
  const code = fs.readFileSync(filePath, 'utf8');
  console.log('Intentando parsear AgentesView.jsx con esbuild...');
  transformSync(code, {
    loader: 'jsx',
    target: 'es2020',
  });
  console.log('¡Sintaxis de JavaScript/JSX Correcta!');
} catch (err) {
  console.error('Error de parseo detectado:');
  console.error(err.message);
  if (err.location) {
    console.error('Ubicación:', err.location);
  }
}
