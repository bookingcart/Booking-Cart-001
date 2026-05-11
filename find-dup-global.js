const fs = require('fs');
const path = require('path');

const allFunctions = new Map();

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f.startsWith('.') || f === 'node_modules' || f === 'dist' || f === 'build' || f === 'jscpd-report') return;
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

function checkFile(filePath) {
  if (!filePath.endsWith('.js') && !filePath.endsWith('.jsx')) return;
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // match top-level or named function declarations
  const functionRegex = /(?:function\s+([a-zA-Z0-9_]+)\s*\(|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?function\s*\()/g;
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3];
    if (name) {
      if (!allFunctions.has(name)) {
        allFunctions.set(name, []);
      }
      allFunctions.get(name).push(filePath);
    }
  }
}

walkDir('.', checkFile);

for (const [name, files] of allFunctions.entries()) {
  if (files.length > 1) {
    // Check if it's identical cross-file duplicates or just common names like "render"
    // We'll just print ones that are defined in >1 file and see if they look suspicious
    if (!['render', 'init', 'fetch', 'applyCors', 'handler', 'map', 'filter', 'reduce'].includes(name) && name.length > 4) {
      console.log(`Function ${name} is duplicated in: ${[...new Set(files)].join(', ')}`);
    }
  }
}
