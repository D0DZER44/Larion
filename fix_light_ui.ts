import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (!fs.existsSync(dirPath)) return;
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
      callback(dirPath);
    }
  });
}

function processFile(filePath: string) {
  let originalContent = fs.readFileSync(filePath, 'utf-8');
  let content = originalContent;

  // 1. Text contrast fixes
  // Change text-[var(--text-muted)] on titles / descriptions to something more contrasty in light mode?
  // Text muted in globals.css was #71717A (Gray 500)
  // Text secondary was #52525B (Gray 600)
  // Let's replace text-gray-500 with text-[var(--text-secondary)] or text-[var(--text-muted)]
  content = content.replace(/text-gray-500/g, 'text-[var(--text-muted)]');
  content = content.replace(/text-gray-600/g, 'text-[var(--text-secondary)]');
  content = content.replace(/text-gray-400/g, 'text-[var(--text-muted)]');
  
  // 2. White/Light backgrounds that should adapt
  // Replace static bg-[#1a___] etc that might have been added to some buttons
  
  // 3. Hover elements that fade in light mode
  // bg-gray-100/10 -> hover:bg-[var(--bg-active-group)]
  content = content.replace(/hover:bg-gray-[0-9]{2,3}(?:\/[0-9]+)?/g, 'hover:bg-[var(--bg-active-group)]');
  content = content.replace(/hover:bg-white\/[0-9]+/g, 'hover:bg-[var(--bg-active-group)]');
  content = content.replace(/hover:bg-black\/[0-9]+/g, 'hover:bg-[var(--bg-active-group)]');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log("Light UI basic fixes done.");
