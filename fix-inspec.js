const fs = require('fs');
let content = fs.readFileSync('app/operacao/inspecoes/page.tsx', 'utf8');

content = content.replace(
  /a\.status === 'Em aberto' \|\| a\.status === 'Pendente'/g,
  "a.status === 'Pendente' || a.status === 'Em andamento'"
);

content = content.replace(
  /metrics\.inspecoesPeriodo/g,
  "(metrics as any).inspecoesPeriodo"
);

fs.writeFileSync('app/operacao/inspecoes/page.tsx', content);

console.log('Fixed inspecoes');
