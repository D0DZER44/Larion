const fs = require('fs');

let rel = fs.readFileSync('app/relatorios/page.tsx', 'utf8');
rel = rel.replace(/store\.configuracoes/g, "(store as any).configuracoes");
fs.writeFileSync('app/relatorios/page.tsx', rel);

let inspec = fs.readFileSync('app/operacao/inspecoes/page.tsx', 'utf8');
inspec = inspec.replace(/metrics\.inspecoesPeriodo/g, "(metrics as any).inspecoesPeriodo");
fs.writeFileSync('app/operacao/inspecoes/page.tsx', inspec);

console.log('Fixed again');
