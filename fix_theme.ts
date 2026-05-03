import fs from 'fs';

const files = [
  "app/acoes/components/VisaoGeral.tsx",
  "app/acoes/components/DrawerAcao.tsx",
  "app/acoes/components/ModalNovaAcao.tsx",
  "app/acoes/components/EmAndamento.tsx",
  "app/acoes/components/Historico.tsx",
  "app/acoes/components/Pendentes.tsx",
  "app/acoes/components/Concluidas.tsx",
  "app/acoes/page.tsx",
  "app/operacao/acoes/components/DrawerAcao.tsx",
  "app/operacao/acoes/components/Historico.tsx",
  "app/operacao/acoes/components/ModalNovaAcao.tsx",
  "app/operacao/acoes/components/Concluidas.tsx",
  "app/operacao/acoes/components/EmAndamento.tsx",
  "app/operacao/acoes/components/VisaoGeral.tsx",
  "app/operacao/acoes/components/Pendentes.tsx",
  "app/operacao/acoes/page.tsx",
  "app/operacao/riscos/page.tsx",
  "app/operacao/inspecoes/page.tsx",
  "app/operacao/inspecoes/ExecutionView.tsx",
  "app/page.tsx",
  "app/layout.tsx",
  "app/configuracoes/page.tsx",
  "app/inspecoes/page.tsx",
  "app/inspecoes/ExecutionView.tsx",
  "app/central/page.tsx",
  "app/not-found.tsx",
  "app/riscos/page.tsx",
  "app/relatorios/page.tsx",
  "app/chat/page.tsx",
  "components/TimelineHistory.tsx",
  "components/ThemeToggle.tsx",
  "components/FloatingChat.tsx",
  "components/AcaoRecomendadaCard.tsx",
  "components/Sidebar.tsx",
  "components/LayoutShell.tsx"
];

function processFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  // We want to replace bg-black/20 to 50 with bg-[var(--bg-primary)] 
  // ONLY IF they are not overlays. Overlays usually have "inset-0" or "backdrop-blur"
  content = content.replace(/(?!.*(?:inset-0|backdrop-blur-sm))bg-black\/(?:20|30|40|50|60)/g, 'bg-[var(--bg-primary)]');
  
  // Actually, some lookups fail with negative lookbehind/lookaround in regex if it's too complex or we miss it.
  // Instead, let's just do it simple: replace all with bg-[var(--bg-primary)] then fix the overlays.
  // Since I don't know where exactly they are without regex, let's just do exactly these strings:
  // "bg-black/40 p-6" -> "bg-[var(--bg-primary)] p-6"
  // "bg-black/40 border" -> "bg-[var(--bg-primary)] border"
  // "bg-black/20 p-2" -> "bg-[var(--bg-primary)] p-2"
  content = content.replace(/bg-black\/(?:20|30|40|50|60) p-/g, 'bg-[var(--bg-primary)] p-');
  content = content.replace(/bg-black\/(?:20|30|40|50|60) border/g, 'bg-[var(--bg-primary)] border');
  content = content.replace(/bg-black\/(?:20|30|40|50|60) px-/g, 'bg-[var(--bg-primary)] px-');

  // Let's also check for hover:bg-black/xx which might exist
  content = content.replace(/hover:bg-black\/(?:20|30|40|50)/g, 'hover:bg-[var(--bg-active-group)]');

  fs.writeFileSync(filePath, content);
}

files.forEach(processFile);
console.log("Fifth theme adaptation done.");
