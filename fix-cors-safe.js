const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'api-routes');
const files = fs.readdirSync(dir).filter(f => f.startsWith('duffel-') && f.endsWith('.js'));

for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');

  // Replace import
  content = content.replace(
    /const \{ getCorsHeaders \} = require\('\.\.\/lib\/cors'\);/g,
    "const { applyCors } = require('../lib/cors');"
  );

  // Safely remove the inline function definition
  const lines = content.split('\n');
  const newLines = [];
  let inFunction = false;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('function applyCors(req, res) {')) {
      inFunction = true;
      continue;
    }
    if (inFunction) {
      if (lines[i].trim() === '}') {
        inFunction = false;
      }
      continue;
    }
    newLines.push(lines[i]);
  }

  // Also remove any consecutive blank lines that might have been left
  const cleaned = newLines.join('\n').replace(/\n\n\n+/g, '\n\n');
  fs.writeFileSync(fp, cleaned);
  console.log('Fixed', file);
}
