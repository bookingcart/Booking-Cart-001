const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'api-routes');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.js')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Replace const { getCorsHeaders } = require('../lib/cors');
    // with const { applyCors } = require('../lib/cors');
    // (if getCorsHeaders isn't used elsewhere)
    
    // We will do a regex replacement for the function applyCors
    const applyCorsRegex = /function\s+applyCors\s*\([^)]*\)\s*\{[^}]*getCorsHeaders[^}]*\}[^}]*\}/;
    if (applyCorsRegex.test(content)) {
      content = content.replace(applyCorsRegex, '');
      content = content.replace(/const\s+\{\s*getCorsHeaders\s*\}\s*=\s*require\('\.\.\/lib\/cors'\);/, "const { applyCors } = require('../lib/cors');");
      fs.writeFileSync(filePath, content);
      console.log('Fixed', file);
    }
  }
});
