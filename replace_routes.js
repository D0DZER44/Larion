const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/(["'])\/inspecoes([^a-zA-Z0-9_-])/g, "$1/operacao/inspecoes$2")
    .replace(/(["'])\/riscos([^a-zA-Z0-9_-])/g, "$1/operacao/riscos$2")
    .replace(/(["'])\/acoes([^a-zA-Z0-9_-])/g, "$1/operacao/acoes$2");
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log("Updated: " + filePath);
  }
}

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      replaceInFile(fullPath);
    }
  }
}

scanDir('./app');
scanDir('./components');
scanDir('./lib');
scanDir('./hooks');
