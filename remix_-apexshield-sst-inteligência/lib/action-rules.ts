const BLOCKED_GENERIC_TERMS = [
  'nova acao',
  'acao',
  'nao informado',
  'nao informada',
  'nao definido',
  'nao definida',
  'nao atribuido',
  'nao atribuida',
  'a definir',
  'sem titulo',
  'manual',
  'teste',
];

type GenericActionLike = Record<string, any>;

function collapseWhitespace(value: unknown) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function normalizeToken(value: unknown) {
  return collapseWhitespace(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function isMeaningfulText(value: unknown) {
  const text = collapseWhitespace(value);
  if (!text) return false;

  const normalized = normalizeToken(text);
  if (BLOCKED_GENERIC_TERMS.includes(normalized)) return false;
  if (normalized.length < 3) return false;
  return true;
}

function pickFirstMeaningful(...values: unknown[]) {
  for (const value of values) {
    if (isMeaningfulText(value)) return collapseWhitespace(value);
  }
  return '';
}

function parseCost(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;

  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\.(?=.*\.)/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildDescricao(porQue: string, como: string, onde: string, quem: string, quando: string) {
  const parts = [
    porQue ? `Por que: ${porQue}` : '',
    como ? `Como: ${como}` : '',
    onde ? `Onde: ${onde}` : '',
    quem ? `Quem: ${quem}` : '',
    quando ? `Quando: ${quando}` : '',
  ].filter(Boolean);

  return parts.join('\n');
}

export function isCriticalActionPriority(priority?: string) {
  const normalized = normalizeToken(priority);
  return normalized.includes('critica') || normalized === 'p1';
}

export function actionRequiresEvidence(action: GenericActionLike) {
  return Boolean(action?.exigeEvidencia) || isCriticalActionPriority(action?.prioridade || action?.priority);
}

export function hasActionEvidence(action: GenericActionLike, evidencePayloads: GenericActionLike[] = []) {
  const merged = [...(Array.isArray(action?.evidencia) ? action.evidencia : []), ...evidencePayloads];

  return merged.some((item) => {
    if (!item) return false;

    return [
      item.descricao,
      item.url,
      item.referencia,
      item.nomeArquivo,
      item.baseadoEm,
    ].some(isMeaningfulText);
  });
}

export function normalizeActionDraft<T extends GenericActionLike>(payload: T) {
  const oQue = pickFirstMeaningful(payload.oQue, payload.titulo, payload.title, payload.acaoVinculada);
  const porQue = pickFirstMeaningful(
    payload.porQue,
    payload.justificativa,
    payload.motivo,
    payload.riscoVinculado ? `Reduzir o risco de ${payload.riscoVinculado}` : '',
  );
  const onde = pickFirstMeaningful(payload.onde, payload.setor, payload.category, payload.sector_id);
  const quem = pickFirstMeaningful(
    payload.quem,
    payload.responsavel,
    payload.responsible?.name,
    payload.validador,
    payload.executor,
  );
  const quando = pickFirstMeaningful(payload.quando, payload.prazo, payload.due_date, payload.deadlineTime);
  const como = pickFirstMeaningful(payload.como, payload.descricao, payload.description, payload.procedimentoExecucao);
  const quantoCusta = parseCost(payload.quantoCusta ?? payload.valorEstimado ?? payload.custoEstimado);

  const titulo = pickFirstMeaningful(payload.titulo, payload.title, oQue);
  const descricao = pickFirstMeaningful(
    payload.descricao,
    payload.description,
    buildDescricao(porQue, como, onde, quem, quando),
  );
  const setor = pickFirstMeaningful(payload.setor, payload.category, payload.sector_id, onde);
  const responsavel = pickFirstMeaningful(payload.responsavel, payload.responsible?.name, payload.validador, quem);
  const prazo = pickFirstMeaningful(payload.prazo, payload.due_date, payload.deadlineTime, quando);
  const executor = pickFirstMeaningful(payload.executor, payload.responsavelExecucao, quem);
  const validador = pickFirstMeaningful(payload.validador, payload.responsavelValidacao, responsavel, quem);

  return {
    ...payload,
    oQue,
    porQue,
    onde,
    quem,
    quando,
    como,
    quantoCusta,
    titulo,
    title: pickFirstMeaningful(payload.title, titulo),
    descricao,
    description: pickFirstMeaningful(payload.description, descricao),
    setor,
    responsavel,
    prazo,
    executor,
    validador,
    valorEstimado: quantoCusta ?? payload.valorEstimado,
    exigeEvidencia: payload.exigeEvidencia ?? isCriticalActionPriority(payload.prioridade || payload.priority),
  };
}

export function validateActionDraft(payload: GenericActionLike) {
  const normalized = normalizeActionDraft(payload);
  const errors: string[] = [];

  if (!isMeaningfulText(normalized.oQue)) errors.push('Informe o que deve ser feito na acao.');
  if (!isMeaningfulText(normalized.porQue)) errors.push('Informe por que essa acao precisa acontecer.');
  if (!isMeaningfulText(normalized.onde)) errors.push('Informe onde a acao sera executada.');
  if (!isMeaningfulText(normalized.quem)) errors.push('Informe quem responde pela acao.');
  if (!isMeaningfulText(normalized.quando)) errors.push('Informe quando a acao deve ser concluida.');
  if (!isMeaningfulText(normalized.como)) errors.push('Informe como a acao sera executada.');

  return errors;
}

export function validateActionCompletion(payload: GenericActionLike, evidencePayloads: GenericActionLike[] = []) {
  const errors: string[] = [];

  if (actionRequiresEvidence(payload) && !hasActionEvidence(payload, evidencePayloads)) {
    errors.push('Acao critica nao pode ser concluida sem evidencia.');
  }

  return errors;
}
