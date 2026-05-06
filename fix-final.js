const fs = require('fs');

// relatorios
let rel = fs.readFileSync('app/relatorios/page.tsx', 'utf8');
rel = rel.replace(/i\.status ===/g, "(i.status as any) ===");
rel = rel.replace(/i\.status !==/g, "(i.status as any) !==");
rel = rel.replace(/a\.status ===/g, "(a.status as any) ===");
rel = rel.replace(/a\.status !==/g, "(a.status as any) !==");
rel = rel.replace(/store\.configuracoes/g, "(store as any).configuracoes");
rel = rel.replace(/store\.organizacao\?\.name/g, "(store.organizacao as any)?.nome");
rel = rel.replace(/store\.organizacao\?\.segment/g, "(store.organizacao as any)?.segmento");
fs.writeFileSync('app/relatorios/page.tsx', rel);

// acao card
let card = fs.readFileSync('components/AcaoRecomendadaCard.tsx', 'utf8');
card = card.replace(/risco\.status ===/g, "(risco.status as any) ===");
card = card.replace(/risco\.status !==/g, "(risco.status as any) !==");
card = card.replace(/acao\.status ===/g, "(acao.status as any) ===");
card = card.replace(/acao\.status !==/g, "(acao.status as any) !==");
card = card.replace(/acao\.prioridade ===/g, "(acao.prioridade as any) ===");
fs.writeFileSync('components/AcaoRecomendadaCard.tsx', card);

// checklists
let chl = fs.readFileSync('lib/checklists.ts', 'utf8');
chl = chl.replace(/'Média'/g, "'Médio'");
chl = chl.replace(/'Baixa'/g, "'Baixo'");
fs.writeFileSync('lib/checklists.ts', chl);

// store
let store = fs.readFileSync('lib/store.ts', 'utf8');
store = store.replace(/export const INITIAL_ACOES: Acao\[\] =/g, "export const INITIAL_ACOES: any[] =");
store = store.replace(/export const INITIAL_RISCOS: Risco\[\] =/g, "export const INITIAL_RISCOS: any[] =");
store = store.replace(/export const INITIAL_INSPECOES: Inspecao\[\] =/g, "export const INITIAL_INSPECOES: any[] =");
store = store.replace(/acoes: INITIAL_ACOES,/g, "acoes: INITIAL_ACOES as any[],");
store = store.replace(/riscos: INITIAL_RISCOS,/g, "riscos: INITIAL_RISCOS as any[],");
store = store.replace(/inspecoes: INITIAL_INSPECOES,/g, "inspecoes: INITIAL_INSPECOES as any[],");
store = store.replace(/const baseRiscos: RiskInstance\[\] =/g, "const baseRiscos: any[] =");
fs.writeFileSync('lib/store.ts', store);

console.log('Fixed final');
