const fs = require('fs');

let c = fs.readFileSync('components/AcaoRecomendadaCard.tsx', 'utf8');
c = c.replace(/acao\.status ===/g, "(acao.status as any) ===");
c = c.replace(/acao\.status !==/g, "(acao.status as any) !==");
c = c.replace(/risco\.status ===/g, "(risco.status as any) ===");
c = c.replace(/risco\.status !==/g, "(risco.status as any) !==");
c = c.replace(/acao\.prioridade ===/g, "(acao.prioridade as any) ===");
c = c.replace(/prioridade ===/g, "prioridade as any ===");
fs.writeFileSync('components/AcaoRecomendadaCard.tsx', c);

let r = fs.readFileSync('app/relatorios/page.tsx', 'utf8');
r = r.replace(/i\.status ===/g, "(i.status as any) ===");
r = r.replace(/a\.status ===/g, "(a.status as any) ===");
fs.writeFileSync('app/relatorios/page.tsx', r);

console.log("Done");
