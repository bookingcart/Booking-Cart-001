const fs = require('fs');
const path = require('path');

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
  // Match `function foo(` or `const foo = () =>` or `const foo = async () =>` or `let foo = function`
  const functionRegex = /(?:function\s+([a-zA-Z0-9_]+)\s*\(|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_]+)\s*=>|(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?function\s*\()/g;
  let match;
  const found = new Set();
  const duplicates = new Set();
  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3];
    if (name) {
      if (found.has(name)) {
        duplicates.add(name);
      }
      found.add(name);
    }
  }
  if (duplicates.size > 0) {
    console.log(`${filePath}: ${Array.from(duplicates).join(', ')}`);
  }
}

walkDir('.', checkFile);
