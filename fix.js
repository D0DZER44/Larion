const fs = require('fs');

let content = fs.readFileSync('app/configuracoes/page.tsx', 'utf8');

content = content.replace(
  /activeChecklist\.segmento/g,
  '(activeChecklist as any).segmento'
);
content = content.replace(
  /\{ segmento: e\.target\.value \}/g,
  '{ segmentos: [e.target.value] } as any'
);

content = content.replace(
  /activeChecklist\.atividade/g,
  '(activeChecklist as any).atividade'
);
content = content.replace(
  /\{ atividade: e\.target\.value \}/g,
  '{ atividades: [e.target.value] } as any'
);

content = content.replace(
  /activeChecklist\.nrRelacionada/g,
  '(activeChecklist as any).nrRelacionada'
);
content = content.replace(
  /\{ nrRelacionada: e\.target\.value \}/g,
  '{ nr: e.target.value } as any'
);

fs.writeFileSync('app/configuracoes/page.tsx', content);

console.log('Fixed configuracoes');
