import fs from 'fs';
import path from 'path';

function walkDir(dir: string, callback: (path: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
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

  // Replace border-[color]-500/20 and border-[color]-500/30 when they appear together with bg-[var(--bg-card)]
  // We can just replace them globally if they look like card borders
  // Let's use a regex that matches `border-(blue|red|emerald|orange|indigo|purple|slate)-500/(20|10|30)`
  // BUT we don't want to break small badges.
  // Generally, cards have padding like p-5, p-6, or rounded-[12px] or rounded-xl
  // We'll replace it specifically on lines that contain "bg-[var(--bg-card)]"
  
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('bg-[var(--bg-card)]')) {
      lines[i] = lines[i].replace(/border-[a-z]+-500\/(?:10|20|30|40|50)/g, 'border-[var(--border)]');
      lines[i] = lines[i].replace(/shadow-\[0_0_20px_rgba\([^)]+\)\]/g, 'shadow-[var(--shadow)]');
      lines[i] = lines[i].replace(/shadow-\[0_0_15px_rgba\([^)]+\)\]/g, 'shadow-[var(--shadow)]');
    }
  }
  
  content = lines.join('\n');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated borders on ${filePath}`);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log("Fix borders completed.");
