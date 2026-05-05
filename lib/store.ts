import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyManualRules, RiskInstance } from './risk-calculations';
import { INITIAL_CHECKLISTS } from './checklists';
import { INITIAL_RISK_RULES } from './riskRules';

export type SystemLog = {
  id: string;
  empresa_id: string;
  user_id: string;
  event_type: string;
  description: string;
  origin_type?: string;
  origin_id?: string;
  created_at: string;
  metadata?: any;
};

export type User = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
  avatar: string;
};

export type Alerta = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: 'Ativo' | 'Lido' | 'Arquivado';
  severity: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  origin: 'Risco' | 'Ação' | 'Inspeção' | 'Checklist' | 'Sistema';
  originId?: string;
  package?: string;
  nr?: string;
  createdAt: string;
  link?: string;
};

export type Sector = {
  id: string;
  name: string;
};

export type Rule = {
  id: string;
  name: string;
  checklistOrigin: string;
  question: string;
  condition: string;
  severity: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  autoAction: string;
  assignTo: string;
  deadline: string;
  justification: string;
  isActive: boolean;
};

export type ChecklistSection = {
  id: string;
  title: string;
  questions: { id: string, text: string, type: string, riskMap: string }[];
};

export type ChecklistTemplate = {
  id: string;
  titulo: string;
  category: string;
  status: 'Ativo' | 'Rascunho' | 'Inativo' | 'Revisar';
  proximaRevisao?: string;
  sections: ChecklistSection[];
  pacote: string;
  segmentos: string[];
  atividades: string[];
  nr: string;
  criticidadePadrao?: 'Baixo' | 'Médio' | 'Alta' | 'Crítica';
  geraRiscoSeNaoConforme?: boolean;
  ativo: boolean;
  regraFixa?: boolean;
};

export type EngineConfig = {
  slas: {
    criticoHoras: number;
    altoHoras: number;
    medioDias: number;
    baixoDias: number;
  };
  alertas: {
    notificarAtraso: boolean;
    frequencia: 'Diária' | 'Semanal' | 'Imediata';
  };
  economia: {
    enabled: boolean;
    custoHoraParada: number;
    numEmpregados: number;
    fatorReincidencia: number;
  };
};

export type WorkHours = {
  id: string;
  period_start: string;
  period_end: string;
  sector_id: string;
  employee_count?: number;
  hours_per_day?: number;
  work_days?: number;
  overtime_hours?: number;
  absence_hours?: number;
  total_hours: number;
  calculation_mode: 'Manual' | 'Estimado';
  created_at: string;
  updated_at: string;
};

export type RulePackage = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  segment: string;
  ruleCount: number;
  isLocked?: boolean;
};

export type RiskRule = {
  id: string;
  titulo: string;
  pacote: string;
  segmentos: string[];
  atividades: string[];
  nrRelacionada: string;
  itemNormativoOpcional?: string;
  gatilhosTexto?: string[];
  criticidade: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  condicao: string;
  acaoSugerida: string;
  prazoPadraoHoras: number;
  exigeEvidencia: boolean;
  geraMultaEstimativa?: boolean;
  faixaMultaPadrao?: string;
  ativo: boolean;
};

export type OrganizationProfile = {
  segmento: string;
  atividadesCriticas: string[];
  porte: string;
  tipoOperacao: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string;
  emailCorporativo: string;
  endereco: string;
};

type AppStore = {
  // Organization
  organization: OrganizationProfile;
  updateOrganization: (data: Partial<OrganizationProfile>) => void;

  // Users
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;

  // Sectors
  sectors: Sector[];
  addSector: (sector: Omit<Sector, 'id'>) => void;
  updateSector: (id: string, name: string) => void;
  deleteSector: (id: string) => void;
  reorderSectors: (sectors: Sector[]) => void;

  // Hours
  work_hours: WorkHours[];
  addWorkHours: (record: Omit<WorkHours, 'id'>) => void;
  updateWorkHours: (id: string, record: Partial<WorkHours>) => void;
  deleteWorkHours: (id: string) => void;

  // Rule Packages
  rulePackages: RulePackage[];
  updateRulePackage: (id: string, data: Partial<RulePackage>) => void;

  // Accidents & Incidents
  accidents: any[];
  addAccident: (record: any) => void;
  incidents: any[];
  addIncident: (record: any) => void;

  // EPIs
  epi_records: any[];
  addEpiRecord: (record: any) => void;

  // Rules
  rules: Rule[];
  addRule: (rule: Omit<Rule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<Rule>) => void;
  deleteRule: (id: string) => void;

  // System Core Data
  acoes: any[];
  riscos: any[];
  inspecoes: any[];
  alertas: Alerta[];
  logs: SystemLog[];
  addLog: (log: Omit<SystemLog, 'id' | 'created_at'>) => void;
  addAlerta: (alerta: Omit<Alerta, 'id' | 'createdAt'>) => void;
  updateAlerta: (id: string, alerta: Partial<Alerta>) => void;
  deleteAlerta: (id: string) => void;
  addAcao: (acao: any) => void;
  updateAcao: (id: string, acao: any) => void;
  deleteAcao: (id: string) => void;
  addRisco: (risco: any) => void;
  updateRisco: (id: string, risco: any) => void;
  deleteRisco: (id: string) => void;
  addInspecao: (inspecao: any) => void;
  updateInspecao: (id: string, inspecao: any) => void;
  deleteInspecao: (id: string) => void;

  // Checklists
  checklists: ChecklistTemplate[];
  addChecklist: (checklist: Omit<ChecklistTemplate, 'id'>) => void;
  updateChecklist: (id: string, checklist: Partial<ChecklistTemplate>) => void;
  deleteChecklist: (id: string) => void;
  
  // Risk Rules
  riskRules: RiskRule[];
  addRiskRule: (rule: Omit<RiskRule, 'id'>) => void;
  updateRiskRule: (id: string, rule: Partial<RiskRule>) => void;
  deleteRiskRule: (id: string) => void;

  // Config
  engineConfig: EngineConfig;
  updateEngineConfig: (config: Partial<EngineConfig>) => void;
};

// Helper to map NR to Package
export const nrToPackage: Record<string, string> = {
  'NR-32': 'Saúde/Hospitalar',
  'NR-18': 'Construção Civil',
  'NR-35': 'Construção Civil',
  'NR-12': 'Indústria',
  'NR-10': 'Indústria',
  'NR-20': 'Indústria',
  'NR-11': 'Indústria',
  'NR-23': 'Base SST',
  'NR-26': 'Base SST',
  'NR-01': 'Base SST',
  'NR-06': 'Base SST',
  'NR-17': 'Base SST',
};

export function getPackageFromNr(nr?: string) {
  if (!nr) return 'Base SST';
  const match = nr.match(/NR[- \s]?(\d+)/i);
  if (match) {
     const formatted = `NR-${match[1]}`;
     return nrToPackage[formatted] || 'Base SST';
  }
  return 'Base SST';
}

let processingAutoActions = false;

const processAutoActions = () => {
  if (typeof window === 'undefined') return;
  if (processingAutoActions) return;
  processingAutoActions = true;

  try {
    const state = useAppStore.getState();
    const { riscos, inspecoes, acoes, addAcao, addRisco } = state;
    if (!riscos || !inspecoes || !acoes) return;

    let changes = 0;

    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    // Processar Riscos
    riscos.forEach(r => {
      // 1. Atualizar para Vencido se o prazo expirou
      if (r.prazo && r.status !== 'Resolvido' && r.status !== 'Mitigado' && r.status !== 'Vencido') {
         // O prazo vem no formato "Até X dias" ou é uma data.
         // Mas `r.prazo` nas automações eu setei YYYY-MM-DD. Ou se vier do drawer ele é "Até 3 dias" textualmente.
         // Tem um computed dueDate? 
         // Let's assume if it matches a date pattern YYYY-MM-DD
         if (/^\d{4}-\d{2}-\d{2}/.test(r.prazo)) {
           const prazoDate = new Date(r.prazo);
           prazoDate.setHours(0,0,0,0);
           if (hoje > prazoDate) {
              state.updateRisco(r.id, { ...r, status: 'Vencido', atualizadoEm: new Date().toISOString() });
              changes++;
              r.status = 'Vencido'; // update local reference
           }
         } else if (r.dataLancamento) {
            // "Imediato (até 24h)" -> 1 day
            // "Até 3 dias" -> 3 days
            // "Até 7 dias" -> 7 days
            // "Até 30 dias" -> 30 days
            let days = 30;
            if (r.prazo.includes('24h') || r.prazo.includes('Imediato')) days = 1;
            else if (r.prazo.includes('3 dias')) days = 3;
            else if (r.prazo.includes('7 dias')) days = 7;
            
            const prazoLcto = new Date(r.dataLancamento);
            prazoLcto.setDate(prazoLcto.getDate() + days);
            prazoLcto.setHours(0,0,0,0);
            
            if (hoje > prazoLcto) {
              state.updateRisco(r.id, { ...r, status: 'Vencido', atualizadoEm: new Date().toISOString() });
              changes++;
              r.status = 'Vencido';
            }
         }
      }

      const isCritical = r.nivel === 'Crítico' || r.level === 'Crítico' || r.nivel === 'Alto' || r.level === 'Alto';
      if (isCritical && r.status !== 'Resolvido' && r.status !== 'Mitigado') {
        const existingAcao = acoes.find(a => a.item_origem_id === r.id && a.item_origem_tipo === 'risco');
        if (!existingAcao && !r.autoActionCreated) {
          const isP1 = r.nivel === 'Crítico' || r.level === 'Crítico';
          const prazo = new Date();
          prazo.setDate(prazo.getDate() + (isP1 ? 1 : 3)); // 1 day for P1, 3 days for P2

          addAcao({
            id: `auto-acao-risco-${r.id || crypto.randomUUID()}`,
            title: `Mitigar Risco Automático: ${r.titulo || r.title || r.atividade || r.setor || 'Não especificado'}`,
            description: `Ação gerada automaticamente a partir do risco classificado como ${r.nivel || r.level}.`,
            priority: isP1 ? 'P1' : 'P2',
            prioridade: isP1 ? 'Crítica' : 'Alta',
            status: 'Pendente',
            source_type: 'risco',
            source_id: r.id,
            item_origem_id: r.id,
            item_origem_tipo: 'risco',
            category: 'Riscos',
            sector_id: r.sector_id || r.setor || '',
            responsavel: r.responsavel || 'SSO',
            pacote: r.pacote || getPackageFromNr(r.nr),
            due_date: prazo.toISOString(),
            prazo: prazo.toISOString().split('T')[0],
            created_by: 'Sistema (Auto)',
            auto_generated: true,
            createdAt: new Date().toISOString()
          });
          changes++;
          r.autoActionCreated = true;
        }
      }
    });

    // Processar Inspeções
    inspecoes.forEach(i => {
      // 1. Gerar Risco Automático baseado em respostas não conformes
      if (Array.isArray(i.answers)) {
        i.answers.forEach((ans: any) => {
          if (ans.isConform === false && ans.question) {
            const existingRisk = riscos.find(r => r.inspection_id === i.id && r.checklist_item_id === (ans.questionId || ans.question));
            if (!existingRisk) {
               const draftRisk: Partial<RiskInstance> = {
                  titulo: `Desvio: ${ans.question.substring(0, 40)}...`,
                  atividade: i.atividade || i.title || i.nome || 'Inspeção',
                  setor: i.sector_id || i.setor || 'Geral',
                  nr: ans.nr || i.nr || 'NR-01',
                  severidade: ans.severity || 'Média',
                  status: 'Aberto',
                  origem: 'Automático',
                  justificativa: `Gerado automaticamente da Inspeção "${i.title || i.nome}". Resposta Não Conforme: "${ans.question}".`,
                  dataLancamento: new Date().toISOString().split('T')[0],
                  checklistOrigem: i.id,
                  perguntaOrigem: ans.question,
                  respostaOrigem: String(ans.value),
                  criadoEm: new Date().toISOString(),
                  inspection_id: i.id,
                  checklist_item_id: ans.questionId || ans.question,
                  pacote: ans.pacote || i.pacote || getPackageFromNr(ans.nr || i.nr),
                  hasEpiEpc: true, // Defaulting for auto-risk
                  hasTreinamento: true,
                  hasProcedimento: true
               };

               const calibratedRisk = applyManualRules(draftRisk);
               addRisco(calibratedRisk);
               changes++;
            }
          }
        });
      }

      // Condition: failed inspection or inspection with critical non-conformity
      const isCritical = i.status === 'Reprovada' || i.resultado === 'Reprovada' || i.nonConformities > 0 || i.status === 'Atrasada';
      if (isCritical) {
        const existingAcao = acoes.find(a => a.item_origem_id === i.id && a.item_origem_tipo === 'inspecao');
        if (!existingAcao && !i.autoActionCreated) {
          const isP1 = i.status === 'Atrasada' || (i.nonConformities && i.nonConformities > 0);
          const prazo = new Date();
          prazo.setDate(prazo.getDate() + (isP1 ? 1 : 3));

          addAcao({
            id: `auto-acao-insp-${i.id || crypto.randomUUID()}`,
            title: `Ação para Inspeção: ${i.title || i.nome || i.titulo || 'Pendente'}`,
            description: `Ação gerada automaticamente a partir de problema na inspeção.`,
            priority: isP1 ? 'P1' : 'P2',
            prioridade: isP1 ? 'Urgente' : 'Alta',
            status: 'Pendente',
            source_type: 'inspecao',
            source_id: i.id,
            item_origem_id: i.id,
            item_origem_tipo: 'inspecao',
            category: 'Inspeções',
            sector_id: i.sector_id || i.setor || '',
            responsavel: i.responsavel || i.inspector || 'Supervisor',
            pacote: i.pacote || getPackageFromNr(i.nr),
            due_date: prazo.toISOString(),
            prazo: prazo.toISOString().split('T')[0],
            created_by: 'Sistema (Auto)',
            auto_generated: true,
            createdAt: new Date().toISOString()
          });
          changes++;
        }
      }
    });

    if (changes > 0) {
      console.log(`[Auto-Generate] Criadas ${changes} ações automáticas.`);
    }
  } finally {
    processingAutoActions = false;
  }
};

export const AppState = {
  get(key?: string) {
    const state = useAppStore.getState();
    return key ? (state as any)[key] : state;
  },
  set(key: string, value: any) {
    useAppStore.setState({ [key]: value });
  },
  save() {
    // Zustand persist middleware automatically saves on state change.
    // We can force a save by touching the state or just log.
    console.log('[AppState] State saved to local storage.');
  },
  load() {
    useAppStore.persist.rehydrate();
    console.log('[AppState] State rehydrated from local storage.');
  },
  sync() {
    console.log('[AppState] Synced with remote servers (Mock).');
    return true;
  }
};

if (typeof window !== 'undefined') {
  (window as any).AppState = AppState;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      organization: {
        segmento: 'Indústria',
        atividadesCriticas: ['Trabalho em altura', 'Máquinas e equipamentos', 'Ruído'],
        porte: 'Média',
        tipoOperacao: 'Industrial',
        razaoSocial: 'Larion Indústria Ltda.',
        cnpj: '12.345.678/0001-90',
        telefone: '(11) 3456-7890',
        emailCorporativo: 'contato@larion.com.br',
        endereco: 'Rua das Indústrias, 123, Galpão A - São Paulo/SP'
      },
      updateOrganization: (data) => set((state) => ({ organization: { ...state.organization, ...data } })),

      users: [
        { id: '1', name: 'Rafael Oliveira', role: 'Engenheiro de Seg.', email: 'rafael@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
        { id: '2', name: 'João Silva', role: 'Supervisor Manut.', email: 'joao.s@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d' },
        { id: '3', name: 'Marcos Antônio', role: 'Técnico SST', email: 'marcos@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
        { id: '4', name: 'Cláudia Ramos', role: 'Gerente Op.', email: 'claudia@larion.com', status: 'Inativo', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
      ],
      addUser: (user) => set((state) => ({ users: [...state.users, { ...user, id: crypto.randomUUID() }] })),
      updateUser: (id, user) => set((state) => ({ users: state.users.map((u) => u.id === id ? { ...u, ...user } : u) })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter((u) => u.id !== id) })),

      sectors: [
        { id: 's1', name: 'Manutenção' },
        { id: 's2', name: 'Produção (Linha 1)' },
        { id: 's3', name: 'Logística' },
        { id: 's4', name: 'Usinagem' },
        { id: 's5', name: 'Pintura' },
        { id: 's6', name: 'Administrativo' },
      ],
      addSector: (sector) => set((state) => ({ sectors: [...state.sectors, { ...sector, id: crypto.randomUUID() }] })),
      updateSector: (id, name) => set((state) => ({ sectors: state.sectors.map((s) => s.id === id ? { ...s, name } : s) })),
      deleteSector: (id) => set((state) => ({ sectors: state.sectors.filter((s) => s.id !== id) })),
      reorderSectors: (sectors) => set({ sectors }),

      work_hours: [],
      addWorkHours: (record) => set((state) => ({ work_hours: [...state.work_hours, { ...record, id: crypto.randomUUID() }] })),
      updateWorkHours: (id, record) => set((state) => ({ work_hours: state.work_hours.map((r) => r.id === id ? { ...r, ...record } : r) })),
      deleteWorkHours: (id) => set((state) => ({ work_hours: state.work_hours.filter((r) => r.id !== id) })),

      rulePackages: [
        { id: 'pkg-base', name: 'Base SST', description: 'Regras essenciais aplicáveis à maioria das operações.', isActive: true, segment: 'Geral', ruleCount: 14, isLocked: true },
        { id: 'pkg-const', name: 'Construção Civil', description: 'Regras para obras, altura, andaimes, escavações, máquinas e sinalização de obra.', isActive: false, segment: 'Construção', ruleCount: 9 },
        { id: 'pkg-ind', name: 'Indústria', description: 'Regras para máquinas, manutenção, energia, produtos químicos, ruído, calor e ergonomia operacional.', isActive: false, segment: 'Indústria', ruleCount: 6 },
        { id: 'pkg-saude', name: 'Saúde/Hospitalar', description: 'Regras para risco biológico, perfurocortantes, resíduos de saúde, higienização e EPIs específicos.', isActive: false, segment: 'Saúde', ruleCount: 4 },
      ],
      updateRulePackage: (id, data) => set((state) => ({
        rulePackages: state.rulePackages.map(pkg => pkg.id === id ? { ...pkg, ...data } : pkg)
      })),

      accidents: [],
      addAccident: (record) => set((state) => ({ accidents: [...state.accidents, { ...record, id: crypto.randomUUID() }] })),
      incidents: [],
      addIncident: (record) => set((state) => ({ incidents: [...state.incidents, { ...record, id: crypto.randomUUID() }] })),

      epi_records: [],
      addEpiRecord: (record) => set((state) => ({ epi_records: [...state.epi_records, { ...record, id: crypto.randomUUID() }] })),

      rules: [
        {
          id: 'r1',
          name: 'Risco de Prensagem (Máquina sem protetor)',
          checklistOrigin: 'Máquinas e Equip.',
          question: 'A proteção fixa está instalada?',
          condition: 'NÃO',
          severity: 'Crítico',
          autoAction: 'Bloquear máq. e reinstalar proteção',
          assignTo: 'Equipe de Manutenção Elétrica',
          deadline: 'Imediato (4h)',
          justification: 'Exposição a partes móveis cortantes.',
          isActive: true,
        }
      ],
      addRule: (rule) => set((state) => ({ rules: [...state.rules, { ...rule, id: crypto.randomUUID(), editavel: true, removivel: true, regraFixa: false } as any] })),
      updateRule: (id, rule) => {
         if (id.startsWith('nr-')) {
            alert('Esta é uma regra fixa do motor e não pode ser editada.');
            return;
         }
         if (rule.isActive !== undefined && id.startsWith('nr-')) {
            alert('Regras fixas NR permanecem sempre ativas.');
            return;
         }
         set((state) => ({ rules: state.rules.map((r) => r.id === id ? { ...r, ...rule } : r) }))
      },
      deleteRule: (id) => {
         if (id.startsWith('nr-')) {
            alert('Esta regra é obrigatória para o funcionamento do motor normativo.');
            return;
         }
         set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }))
      },

      acoes: [
        {
          id: 'act-1',
          titulo: 'Instalar linha de vida provisória',
          descricao: 'Instalar linha de vida e travas de queda no galpão A antes da pintura.',
          prioridade: 'Alta',
          status: 'Em andamento',
          setor: 'Administrativo',
          responsavel: 'João Silva', // Area owner
          prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progresso: 20,
          origem: 'Inspeção',
          riscoId: 'r1',
          trabalhadoresExpostos: 2,
          perfilExposto: 'Pintor Predial',
          impactoHumano: 'Queda de nível (risco de morte)',
          executor: 'Equipe Especializada NR-35',
          validador: 'Rafael Oliveira (Eng. Seg.)',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
          iniciadoEm: new Date().toISOString(),
          concluidoEm: null,
          evidencia: [],
          historico: []
        },
        {
          id: 'act-2',
          titulo: 'Isolamento de painel elétrico aberto',
          descricao: 'Isolar painel e adequar fechos no quadro principal.',
          prioridade: 'Crítica',
          status: 'Pendente',
          setor: 'Manutenção',
          responsavel: 'Marcos Antônio',
          prazo: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progresso: 0,
          origem: 'Inspeção',
          riscoId: 'r2',
          trabalhadoresExpostos: 1,
          perfilExposto: 'Eletricista Nível II',
          impactoHumano: 'Eletrocussão',
          executor: 'Contratada Elétrica',
          validador: 'João Silva (Sup. Manut.)',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
          iniciadoEm: null,
          concluidoEm: null,
          evidencia: [],
          historico: []
        }
      ],
      riscos: [
        applyManualRules({ id: 'r1', atividade: 'Trabalho em altura', setor: 'Operacional', nr: 'NR-35', hasEpiEpc: false, hasProcedimento: false, hasTreinamento: true, status: 'Aberto', trabalhadoresExpostos: 2, perfilExposto: 'Pintor Predial', impactoHumano: 'Queda de nível (fraturas graves ou óbito)', executorCorrecao: 'Equipe Especializada NR-35', validadorCorrecao: 'Rafael Oliveira (Eng. Seg.)' }),
        applyManualRules({ id: 'r2', atividade: 'Manutenção elétrica', setor: 'Manutenção', nr: 'NR-10', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Em análise', trabalhadoresExpostos: 1, perfilExposto: 'Eletricista Nível II', impactoHumano: 'Choque elétrico (queimaduras ou parada cardíaca)', executorCorrecao: 'Contratada Elétrica', validadorCorrecao: 'João Silva (Sup. Manut.)' }),
        applyManualRules({ id: 'r3', atividade: 'Operação de máquinas', setor: 'Produção', nr: 'NR-12', hasEpiEpc: false, hasProcedimento: true, hasTreinamento: true, status: 'Aberto', trabalhadoresExpostos: 5, perfilExposto: 'Operador de Prensa', impactoHumano: 'Prensagem de membros (amputação)', executorCorrecao: 'Equipe de Manutenção Mecânica', validadorCorrecao: 'Marcos Antônio (Téc. SST)' }),
        applyManualRules({ id: 'r4', atividade: 'Trabalho em altura', setor: 'Logística', nr: 'NR-35', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Aberto' }),
        applyManualRules({ id: 'r5', atividade: 'Espaço confinado', setor: 'Manutenção', nr: 'NR-33', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: false, status: 'Aberto', trabalhadoresExpostos: 3, perfilExposto: 'Limpador de Tanques', impactoHumano: 'Asfixia e intoxicação (óbito rápido)', executorCorrecao: 'Equipe de Resgate e Limpeza', validadorCorrecao: 'Rafael Oliveira (Eng. Seg.)' }),
        applyManualRules({ id: 'r6', atividade: 'Movimentação de cargas', setor: 'Logística', nr: 'NR-11', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Aberto' }),
        applyManualRules({ id: 'r7', atividade: 'Trabalho a quente', setor: 'Manutenção', nr: 'NR-34', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Em análise' }),
        applyManualRules({ id: 'r8', atividade: 'Trabalho em altura', setor: 'Administrativo', nr: 'NR-35', hasEpiEpc: true, hasProcedimento: true, hasTreinamento: true, status: 'Em análise' }),
      ],
      inspecoes: [
        {
          id: 'ins-1',
          tipoInspecao: 'Trabalho em Altura (NR-35)',
          checklist: 'Trabalho em Altura',
          pacote: 'Construção Civil',
          ondeUsar: 'Área de Estoque Externo',
          data: new Date().toISOString().split('T')[0],
          proximaInspecao: new Date().toISOString().split('T')[0],
          responsavel: 'Rafael Oliveira',
          prioridade: 'Alta',
          situacao: 'Agendada',
          status: 'Agendada',
          trabalhadoresExpostos: 5,
          perfilExposto: 'Montadores de Estrutura',
          items: []
        },
        {
          id: 'ins-2',
          tipoInspecao: 'Segurança Área Fabril',
          checklist: 'Segurança Área Fabril',
          pacote: 'Base SST',
          ondeUsar: 'Produção (Linha 1)',
          data: new Date().toISOString().split('T')[0],
          proximaInspecao: new Date().toISOString().split('T')[0],
          responsavel: 'João Silva',
          prioridade: 'Média',
          situacao: 'Em andamento',
          status: 'Em andamento',
          trabalhadoresExpostos: 12,
          perfilExposto: 'Operadores de Máquina / Setor de Ensacagem',
          items: [
            { id: 'q1', status: 'Sim', text: 'O ambiente está limpo e organizado?', riskMap: 'Baixo', pacote: 'Base SST' },
            { id: 'q2', status: 'Não', text: 'Rotas de fuga desobstruídas?', riskMap: 'Crítico', pacote: 'Base SST' },
          ]
        },
        {
          id: 'ins-3',
          tipoInspecao: 'Elétrica (NR-10)',
          checklist: 'Máquinas e Equip.',
          pacote: 'Indústria',
          ondeUsar: 'Manutenção',
          data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          proximaInspecao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          responsavel: 'Marcos Antônio',
          prioridade: 'Alta',
          situacao: 'Atrasada',
          status: 'Atrasada',
          trabalhadoresExpostos: 2,
          perfilExposto: 'Eletricistas de Manutenção',
          items: []
        }
      ],
      alertas: [
        { id: 'a1', type: 'risco_critico', title: 'Risco Crítico Detectado', description: 'Trabalho em altura sem proteção em obra.', status: 'Ativo', severity: 'Crítico', origin: 'Risco', package: 'Construção Civil', nr: 'NR-35', createdAt: new Date().toISOString(), link: '/operacao/riscos' },
        { id: 'a2', type: 'acao_vencida', title: 'Ação Vencida', description: 'Revisão de proteções de máquinas atrasada.', status: 'Ativo', severity: 'Alto', origin: 'Ação', package: 'Indústria', nr: 'NR-12', createdAt: new Date().toISOString(), link: '/operacao/acoes' },
        { id: 'a3', type: 'checklist_pendente', title: 'Checklist Pendente', description: 'Inspeção de EPIs da saúde pendente.', status: 'Ativo', severity: 'Médio', origin: 'Checklist', package: 'Saúde/Hospitalar', nr: 'NR-32', createdAt: new Date().toISOString(), link: '/inspecoes' },
        { id: 'a4', type: 'alerta_geral', title: 'Novo Colaborador', description: 'Novo engenheiro de segurança admitido.', status: 'Ativo', severity: 'Baixo', origin: 'Sistema', package: 'Base SST', createdAt: new Date().toISOString(), link: '/configuracoes' },
      ],
      logs: [],
      addLog: (log) => set((state) => ({ logs: [...state.logs, { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }] })),
      addAlerta: (alerta) => set((state) => ({ alertas: [...state.alertas, { ...alerta, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] })),
      updateAlerta: (id, alerta) => set((state) => ({ alertas: state.alertas.map(a => a.id === id ? { ...a, ...alerta } : a) })),
      deleteAlerta: (id) => set((state) => ({ alertas: state.alertas.filter(a => a.id !== id) })),
      addAcao: (acao) => set((state) => {
        const id = acao.id || crypto.randomUUID();
        const newAcao = { ...acao, id };
        
        // Define package if missing
        if (!newAcao.pacote && !newAcao.package) {
          newAcao.pacote = getPackageFromNr(acao.nr);
        }

        const newLog = {
          id: crypto.randomUUID(),
          empresa_id: acao.empresa_id || '1',
          user_id: acao.responsavel || 'Sistema',
          event_type: 'acao_gerada',
          description: `Ação gerada: ${acao.title || acao.titulo}`,
          origin_type: 'acao',
          origin_id: id,
          created_at: new Date().toISOString()
        };

        const newAlert: Alerta = {
          id: crypto.randomUUID(),
          type: 'acao_gerada',
          title: 'Nova Ação Gerada',
          description: `Uma nova ação foi gerada: ${acao.title || acao.titulo}`,
          status: 'Ativo',
          severity: acao.prioridade === 'Crítica' ? 'Crítico' : (acao.prioridade === 'Alta' ? 'Alto' : 'Médio'),
          origin: 'Ação',
          originId: id,
          package: newAcao.pacote || newAcao.package,
          nr: acao.nr,
          createdAt: new Date().toISOString(),
          link: '/operacao/acoes'
        };

        return { 
          acoes: [...state.acoes, newAcao], 
          logs: [...state.logs, newLog],
          alertas: [...state.alertas, newAlert]
        };
      }),
      updateAcao: (id, acao) => set((state) => {
        const oldAcao = state.acoes.find(a => a.id === id);
        let newLogs = [...state.logs];
        if (oldAcao) {
           if ((oldAcao.status !== 'Concluída') && (acao.status === 'Concluída')) {
              newLogs.push({
                id: crypto.randomUUID(),
                empresa_id: acao.empresa_id || oldAcao.empresa_id || '1',
                user_id: acao.responsavel || oldAcao.responsavel || 'Sistema',
                event_type: 'acao_concluida',
                description: `Ação concluída: ${acao.title || oldAcao.title || acao.titulo || oldAcao.titulo}`,
                origin_type: 'acao',
                origin_id: id,
                created_at: new Date().toISOString()
              });
           }
        }
        return {
          acoes: state.acoes.map((v) => v.id === id ? { ...v, ...acao } : v),
          logs: newLogs
        };
      }),
      deleteAcao: (id) => set((state) => ({ acoes: state.acoes.filter((v) => v.id !== id) })),
      addRisco: (risco) => {
        set((state) => {
          const id = risco.id || crypto.randomUUID();
          const newRisco = { ...risco, id };
          
          if (!newRisco.pacote && !newRisco.package) {
            newRisco.pacote = getPackageFromNr(risco.nr);
          }

          const newLog = {
            id: crypto.randomUUID(),
            empresa_id: risco.empresa_id || '1',
            user_id: risco.user_id || 'Sistema',
            event_type: 'risco_gerado',
            description: `Risco gerado: ${risco.title || risco.titulo}`,
            origin_type: 'risco',
            origin_id: id,
            created_at: new Date().toISOString()
          };

          const newAlert: Alerta = {
            id: crypto.randomUUID(),
            type: 'risco_gerado',
            title: 'Novo Risco Detectado',
            description: `Um novo risco foi identificado: ${risco.title || risco.titulo}`,
            status: 'Ativo',
            severity: (risco.nivel || 'Médio') as any,
            origin: 'Risco',
            originId: id,
            package: newRisco.pacote || newRisco.package,
            nr: risco.nr,
            createdAt: new Date().toISOString(),
            link: '/operacao/riscos'
          };

          return { 
            riscos: [...state.riscos, newRisco], 
            logs: [...state.logs, newLog],
            alertas: [...state.alertas, newAlert]
          };
        });
        useAppStore.getState().engineConfig && processAutoActions();
      },
      updateRisco: (id, risco) => {
        set((state) => ({ riscos: state.riscos.map((v) => v.id === id ? { ...v, ...risco } : v) }));
        processAutoActions();
      },
      deleteRisco: (id) => {
        set((state) => ({ riscos: state.riscos.filter((v) => v.id !== id) }));
      },
      addInspecao: (inspecao) => {
        set((state) => {
          const id = inspecao.id || crypto.randomUUID();
          const newInspecao = { ...inspecao, id };
          const newLog = {
            id: crypto.randomUUID(),
            empresa_id: inspecao.empresa_id || '1',
            user_id: inspecao.inspector || 'Sistema',
            event_type: 'inspecao_criada',
            description: `Inspeção criada: ${inspecao.title || inspecao.nome || inspecao.titulo}`,
            origin_type: 'inspecao',
            origin_id: id,
            created_at: new Date().toISOString()
          };
          
          let newLogs = [...state.logs, newLog];
          if (inspecao.nonConformities > 0) {
             newLogs.push({
                id: crypto.randomUUID(),
                empresa_id: inspecao.empresa_id || '1',
                user_id: inspecao.inspector || 'Sistema',
                event_type: 'item_nao_conforme_identificado',
                description: `Foram identificados ${inspecao.nonConformities} itens não conformes na inspeção.`,
                origin_type: 'inspecao',
                origin_id: id,
                created_at: new Date().toISOString()
             });
          }
          
          return { inspecoes: [...state.inspecoes, newInspecao], logs: newLogs };
        });
        processAutoActions();
      },
      updateInspecao: (id, inspecao) => {
        set((state) => {
          const oldInspecao = state.inspecoes.find(i => i.id === id);
          let newLogs = [...state.logs];
          if (oldInspecao) {
            newLogs.push({
              id: crypto.randomUUID(),
              empresa_id: inspecao.empresa_id || oldInspecao.empresa_id || '1',
              user_id: inspecao.inspector || oldInspecao.inspector || 'Sistema',
              event_type: 'inspecao_editada',
              description: `Inspeção editada: ${inspecao.title || oldInspecao.title || inspecao.nome || oldInspecao.nome}`,
              origin_type: 'inspecao',
              origin_id: id,
              created_at: new Date().toISOString()
            });
            
            if (inspecao.status === 'Anulada' && oldInspecao.status !== 'Anulada') {
               newLogs.push({
                 id: crypto.randomUUID(),
                 empresa_id: inspecao.empresa_id || oldInspecao.empresa_id || '1',
                 user_id: inspecao.inspector || oldInspecao.inspector || 'Sistema',
                 event_type: 'inspecao_anulada',
                 description: `Inspeção anulada: ${inspecao.title || oldInspecao.title || inspecao.nome || oldInspecao.nome}`,
                 origin_type: 'inspecao',
                 origin_id: id,
                 created_at: new Date().toISOString()
               });
            }
          }
          return {
            inspecoes: state.inspecoes.map((v) => v.id === id ? { ...v, ...inspecao } : v),
            logs: newLogs
          };
        });
        processAutoActions();
      },
      deleteInspecao: (id) => {
        set((state) => ({ inspecoes: state.inspecoes.filter((v) => v.id !== id) }));
      },

      checklists: INITIAL_CHECKLISTS,
      addChecklist: (checklist) => set((state) => ({ checklists: [...state.checklists, { ...checklist, id: crypto.randomUUID() }] })),
      updateChecklist: (id, checklist) => set((state) => ({ checklists: state.checklists.map((c) => c.id === id ? { ...c, ...checklist } : c) })),
      deleteChecklist: (id) => set((state) => ({ checklists: state.checklists.filter((c) => c.id !== id) })),
      
      riskRules: INITIAL_RISK_RULES,
      addRiskRule: (rule) => set((state) => ({ riskRules: [...state.riskRules, { ...rule, id: crypto.randomUUID() }] })),
      updateRiskRule: (id, rule) => set((state) => ({ riskRules: state.riskRules.map((r) => r.id === id ? { ...r, ...rule } : r) })),
      deleteRiskRule: (id) => set((state) => ({ riskRules: state.riskRules.filter((r) => r.id !== id) })),
      
      engineConfig: {
        slas: {
          criticoHoras: 24,
          altoHoras: 72,
          medioDias: 15,
          baixoDias: 30,
        },
        alertas: {
          notificarAtraso: true,
          frequencia: 'Diária',
        },
        economia: {
          enabled: true,
          custoHoraParada: 500,
          numEmpregados: 120,
          fatorReincidencia: 1.2,
        }
      },
      updateEngineConfig: (config) => set((state) => ({ engineConfig: { ...state.engineConfig, ...config } })),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

