const fs = require('fs');

function globalReplace(file, src, dst) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(src, dst);
  fs.writeFileSync(file, content);
}

// store
let store = fs.readFileSync('lib/store.ts', 'utf8');
store = store.replace(/export const INITIAL_ACOES =/g, "export const INITIAL_ACOES: any[] =");
store = store.replace(/export const INITIAL_RISCOS =/g, "export const INITIAL_RISCOS: any[] =");
store = store.replace(/export const INITIAL_INSPECOES =/g, "export const INITIAL_INSPECOES: any[] =");
store = store.replace(/const baseRiscos: RiskInstance\[\] =/g, "const baseRiscos: any[] =");
// let's just make sure
store = store.replace(/export const INITIAL_ACOES: Acao\[\] =/g, "export const INITIAL_ACOES: any[] =");
store = store.replace(/export const INITIAL_ACOES: any\[\] =/g, "export const INITIAL_ACOES: any[] =");
store = store.replace(/export const INITIAL_RISCOS: Risco\[\] =/g, "export const INITIAL_RISCOS: any[] =");
store = store.replace(/export const INITIAL_INSPECOES: Inspecao\[\] =/g, "export const INITIAL_INSPECOES: any[] =");

store = store.replace(/acoes: INITIAL_ACOES,/g, "acoes: INITIAL_ACOES as any[],");
store = store.replace(/riscos: INITIAL_RISCOS,/g, "riscos: INITIAL_RISCOS as any[],");
store = store.replace(/inspecoes: INITIAL_INSPECOES,/g, "inspecoes: INITIAL_INSPECOES as any[],");

// actually in store:
store = store.replace(/export const INITIAL_ACOES/g, "export const INITIAL_ACOES: any[]");
store = store.replace(/export const INITIAL_RISCOS/g, "export const INITIAL_RISCOS: any[]");
store = store.replace(/export const INITIAL_INSPECOES/g, "export const INITIAL_INSPECOES: any[]");
store = store.replace(/export const INITIAL_ACOES: any\[\]: any\[\]/g, "export const INITIAL_ACOES: any[]");
store = store.replace(/export const INITIAL_RISCOS: any\[\]: any\[\]/g, "export const INITIAL_RISCOS: any[]");
store = store.replace(/export const INITIAL_INSPECOES: any\[\]: any\[\]/g, "export const INITIAL_INSPECOES: any[]");
store = store.replace(/export const INITIAL_ACOES/g, "export const INITIAL_ACOES: any");
store = store.replace(/export const INITIAL_RISCOS/g, "export const INITIAL_RISCOS: any");
store = store.replace(/export const INITIAL_INSPECOES/g, "export const INITIAL_INSPECOES: any");
store = store.replace(/export const INITIAL_ACOES: any: any\[\]/g, "export const INITIAL_ACOES: any");
store = store.replace(/export const INITIAL_RISCOS: any: any\[\]/g, "export const INITIAL_RISCOS: any");
store = store.replace(/export const INITIAL_INSPECOES: any: any\[\]/g, "export const INITIAL_INSPECOES: any");

fs.writeFileSync('lib/store.ts', store);


// relatorios
let rel = fs.readFileSync('app/relatorios/page.tsx', 'utf8');
rel = rel.replace(/store\.configuracoes/g, "(store as any).configuracoes");
rel = rel.replace(/store\.organizacao\?\.name/g, "(store.organizacao as any)?.nome");
rel = rel.replace(/store\.organizacao\?\.segment/g, "(store.organizacao as any)?.segmento");
fs.writeFileSync('app/relatorios/page.tsx', rel);

// acao card
let card = fs.readFileSync('components/AcaoRecomendadaCard.tsx', 'utf8');
card = card.replace(/risco\.status ===/g, "(risco as any).status ===");
card = card.replace(/risco\.status !==/g, "(risco as any).status !==");
card = card.replace(/acao\.status ===/g, "(acao as any).status ===");
card = card.replace(/acao\.status !==/g, "(acao as any).status !==");
card = card.replace(/acao\.prioridade ===/g, "(acao as any).prioridade ===");
fs.writeFileSync('components/AcaoRecomendadaCard.tsx', card);

// inspecoes
let inspec = fs.readFileSync('app/operacao/inspecoes/page.tsx', 'utf8');
inspec = inspec.replace(/metrics\.inspecoesPeriodo/g, "(metrics as any).inspecoesPeriodo");
fs.writeFileSync('app/operacao/inspecoes/page.tsx', inspec);

console.log('Finished');
