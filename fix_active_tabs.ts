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

  const replaceTarget = "bg-purple-600/20 text-purple-300 border border-purple-500/30";
  const replacement = "bg-purple-600/10 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300 border border-purple-500/30";
  
  content = content.replace(new RegExp(replaceTarget.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);

  // In check boxes / pills in chat
  content = content.replace(/bg-purple-600\/20 text-purple-300/g, 'bg-purple-600/10 dark:bg-purple-600/20 text-purple-700 dark:text-purple-300');

  // Let's also fix badges. Usually badges look like: bg-purple-500/10 text-purple-400 border border-purple-500/20
  content = content.replace(/bg-purple-500\/10 text-purple-400 border border-purple-500\/20/g, 'bg-purple-500/10 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20');
  content = content.replace(/bg-purple-500\/10 text-purple-400/g, 'bg-purple-500/10 text-purple-700 dark:text-purple-400');
  
  content = content.replace(/bg-[#7c3aed]\/20 text-[#b48bf8]/g, 'bg-[#7c3aed]/10 dark:bg-[#7c3aed]/20 text-[#7c3aed] dark:text-[#b48bf8]');

  // Update disabled state colors in standard classes
  // "Textos auxiliares ... precisam manter cor semântica mas com saturação adequada para fundo claro"
  content = content.replace(/text-red-400/g, 'text-red-600 dark:text-red-400');
  content = content.replace(/text-emerald-400/g, 'text-emerald-600 dark:text-emerald-400');
  content = content.replace(/text-blue-400/g, 'text-blue-600 dark:text-blue-400');
  content = content.replace(/text-orange-400/g, 'text-orange-600 dark:text-orange-400');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated active tabs/text in ${filePath}`);
  }
}

walkDir('./app', processFile);
walkDir('./components', processFile);
console.log("Fix active tabs done.");

