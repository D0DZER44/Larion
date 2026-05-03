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
  
  const cardBgs = [
    'bg-[#1a2336]', 'bg-[#1e1318]', 'bg-[#121c17]', 'bg-[#1a1727]', 
    'bg-[#1a1315]', 'bg-[#131a16]', 'bg-[#1e2536]', 'bg-[#1a2333]', 
    'bg-[#0c1018]', 'bg-[#1a1512]', 'bg-[#0A0D14]', 'bg-[#0f172a]/80',
    'bg-[#0f172a]', 'bg-[#0B0B0D]', 'bg-[#0F172A]', 'bg-[#1E293B]',
    'bg-[#1a1713]', 'bg-[#1a1c18]', 'bg-[#1a1c23]', 'bg-[#1e1b1d]',
    'bg-[#221e1a]', 'bg-[#1a1e28]', 'bg-[#1e1b4b]/20', 'bg-[#1a1f2e]',
    'bg-[#0e1322]', 'bg-[#0d121e]', 'bg-[#1a1c23]', 'bg-[#1a1d24]',
    'bg-slate-900', 'bg-slate-800', 'bg-zinc-900', 'bg-zinc-800',
    'bg-gray-900', 'bg-gray-800', 'bg-slate-950', 'bg-zinc-950', 'bg-gray-950'
  ];

  cardBgs.forEach(bg => {
    const regex = new RegExp(bg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, 'bg-[var(--bg-card)]');
  });

  content = content.replace(/bg-\[var\(--bg-secondary\)\]/g, 'bg-[var(--bg-card)]');
  
  // Clean up bg-[var(--bg-primary)] used incorrectly in cards that are NOT the global background 
  // Wait, I shouldn't blindly replace bg-primary with bg-card. 
  // But I CAN replace some known incorrect `bg-black` usages which shouldn't exist anymore.
  
  if (content !== o) { fs.writeFileSync(filePath, content); console.log('Updated ' + filePath); }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log('Normalization complete');
