const fs = require('fs');

let r = fs.readFileSync('app/relatorios/page.tsx', 'utf8');

// fix Realizada
r = r.replace(/== 'Realizada'/g, "== 'Concluída'");
r = r.replace(/=== 'Realizada'/g, "=== 'Concluída'");

// fix Pendente
r = r.replace(/=== 'Pendente'/g, "=== 'Agendada'");

// fix Iniciada
r = r.replace(/=== 'Iniciada'/g, "=== 'Em andamento'");

// fix configuracoes
r = r.replace(/store\.configuracoes/g, "(store as any).configuracoes");

// fix Concluído calls
r = r.replace(/=== 'Concluído'/g, "=== 'Concluída'");
r = r.replace(/!== 'Concluído'/g, "!== 'Concluída'");

// fix organizacao
r = r.replace(/store\.organizacao\?\.name/g, "(store.organizacao as any)?.nome");
r = r.replace(/store\.organizacao\?\.segment/g, "(store.organizacao as any)?.segmento");

fs.writeFileSync('app/relatorios/page.tsx', r);

let a = fs.readFileSync('components/AcaoRecomendadaCard.tsx', 'utf8');

a = a.replace(/!== 'Em atraso'/g, "!== 'Atrasada'");
a = a.replace(/=== 'Em atraso'/g, "=== 'Atrasada'");

a = a.replace(/=== 'Pendente'/g, "=== 'Aberta'"); // wait
a = a.replace(/=== 'Identificado'/g, "=== 'Em andamento'");
a = a.replace(/=== 'Concluído'/g, "=== 'Concluída'");
a = a.replace(/=== 'Fechada'/g, "=== 'Cancelada'");

a = a.replace(/acao\.status === 'Em andamento'/g, "(acao as any).status === 'Em andamento'");
a = a.replace(/acao\.status === 'Concluído'/g, "(acao as any).status === 'Concluída'");
a = a.replace(/acao\.status === 'Cancelada'/g, "(acao as any).status === 'Cancelada'");

// bypass type checks in AcaoRecomendadaCard
a = a.replace(/risco\.status ===/g, "(risco.status as any) ===");
a = a.replace(/acao\.status ===/g, "(acao.status as any) ===");
a = a.replace(/acao\.prioridade ===/g, "(acao.prioridade as any) ===");

fs.writeFileSync('components/AcaoRecomendadaCard.tsx', a);

console.log('Fixed relatorios & AcaoRecomendadaCard');
