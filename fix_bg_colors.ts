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

const bgReplacements = [
  // Reddish / Orangeish / Greenish / Blueish black cards
  'bg-[#1a2336]', 'bg-[#1e1318]', 'bg-[#121c17]', 'bg-[#1a1727]', 
  'bg-[#1a1315]', 'bg-[#131a16]', 'bg-[#1e2536]', 'bg-[#1a2333]', 
  'bg-[#0c1018]', 'bg-[#1a1512]', 'bg-[#0A0D14]', 'bg-[#0f172a]/80',
  'bg-[#0f172a]', 'bg-slate-900', 'bg-slate-900/50', 'bg-slate-800/50',
  'bg-[#0B0B0D]', 'bg-[#0F172A]', 'bg-[#1E293B]', 'bg-zinc-900/50',
  'bg-slate-800', 'bg-slate-950', 'bg-zinc-900', 'bg-zinc-950'
];

function processFile(filePath: string) {
  let originalContent = fs.readFileSync(filePath, 'utf-8');
  let content = originalContent;

  // Replace old CSS var references if they were explicitly used
  content = content.replace(/bg-\[var\(--lari-card-bg\)\]/g, 'bg-[var(--bg-card)]');
  content = content.replace(/border-\[var\(--lari-card-border\)\]/g, 'border-[var(--border)]');

  // Replace specific colored borders on standard cards, e.g. "bg-[#xxx] border border-blue-500/20"
  // Actually, let's just make all cards uniform.
  bgReplacements.forEach(bgClass => {
    // If it's a card container, it probably has some colored variants.
    // Replace the specific background class
    const regex = new RegExp(bgClass.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    content = content.replace(regex, 'bg-[var(--bg-card)]');
  });

  // What about "bg-[var(--bg-secondary)]"?
  // Secondary background is now black, so components that use it as a card background might disappear.
  // Wait, if we made secondary black, maybe we change "bg-[var(--bg-secondary)]" to "bg-[var(--bg-card)]" when it's a panel.
  // We'll replace bg-[var(--bg-secondary)] with bg-[var(--bg-card)] everywhere except global background.
  content = content.replace(/bg-\[var\(--bg-secondary\)\]/g, 'bg-[var(--bg-card)]');
  
  // Also standard transparent overlays like from-purple-900/10 
  // User: "Não quero áreas azuladas, acinzentadas... fundo totalmente preto"
  // We should remove things like `bg-gradient-to-b from-slate-900/50 to-black`
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-[a-z]+-[0-9]+\/[0-9]+\s+to-transparent/g, '');
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-[a-z]+-[0-9]+\/[0-9]+\s+to-black\/[0-9]+/g, '');
  content = content.replace(/bg-gradient-to-[a-z]+\s+from-purple-[0-9]+\/[0-9]+\s+to-transparent/g, '');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log("Fix completed.");
