const fs = require('fs');
const path = require('path');
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) walkDir(dirPath, callback);
    else if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) callback(dirPath);
  });
}
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let o = content;
  
  // Replace bg-black if it's the class for some container. We DO NOT want to replace bg-black/40 or bg-black/60
  // because those are overlays for modals and backdrop-blur. 
  // We should match 'bg-black ' or 'bg-black"' 
  content = content.replace(/bg-black(?=[\s"'])/g, 'bg-[var(--bg-primary)]');
  
  // Replace bg-[#0A0A1F] with bg-[var(--bg-primary)]
  content = content.replace(/bg-\[#0A0A1F\]/g, 'bg-[var(--bg-primary)]');
  
  // Replace bg-[#14142B] with bg-[var(--bg-card)]
  content = content.replace(/bg-\[#14142B\]/g, 'bg-[var(--bg-card)]');
  content = content.replace(/bg-\[#14142b\]/g, 'bg-[var(--bg-card)]');

  // Any bg-[var(--bg-primary)] that's used for card-like internal containers
  // like 'bg-[var(--bg-primary)] border border-[var(--border)] p-5 rounded-2xl group hover:border-[var(--border)] hover:bg-[var(--bg-card)]'
  content = content.replace(/bg-\[var\(--bg-primary\)\] border border-\[var\(--border\)\] p-5 rounded-2xl/g, 'bg-[var(--bg-card)] border border-[var(--border)] p-5 rounded-2xl');

  if (content !== o) { fs.writeFileSync(filePath, content); console.log('Updated ' + filePath); }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log('Phase 2 complete');
