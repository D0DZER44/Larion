import fs from 'fs';
import path from 'path';

function processFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let originalContent = fs.readFileSync(filePath, 'utf-8');
  let content = originalContent;

  // Convert light-theme preview cards in relatórios to the new standard dark theme
  content = content.replace(/bg-gray-50\/50/g, 'bg-[var(--bg-card)]');
  content = content.replace(/bg-gray-100/g, 'bg-[var(--bg-primary)]');
  content = content.replace(/bg-gray-50\/5/g, 'bg-[var(--bg-primary)]');
  content = content.replace(/bg-gray-50/g, 'bg-[var(--bg-card)]');
  
  content = content.replace(/border-gray-100/g, 'border-[var(--border)]');
  content = content.replace(/border-gray-200/g, 'border-[var(--border)]');
  content = content.replace(/border-gray-300/g, 'border-[var(--border)]');
  
  // Make sure not to replace print:text-black if it exists, but standard gray text should be standard text
  content = content.replace(/text-gray-800/g, 'text-[var(--text-primary)]');
  content = content.replace(/text-gray-700/g, 'text-[var(--text-primary)]');

  // Convert warning boxes
  content = content.replace(/bg-red-50 text-red-700/g, 'bg-red-500/10 text-red-500');
  content = content.replace(/bg-orange-50 text-orange-700/g, 'bg-orange-500/10 text-orange-500');

  // Same for other tabs if any
  content = content.replace(/bg-gray-500\/10/g, 'bg-[var(--bg-card)]');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated light cards on ${filePath}`);
  }
}

processFile('./app/relatorios/page.tsx');
processFile('./app/configuracoes/page.tsx');
processFile('./app/page.tsx');
console.log("Fix light cards completed.");
