import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyManualRules, RiskInstance } from './risk-calculations';
import { normalizeActionDraft } from './action-rules';
import { INITIAL_CHECKLISTS } from './checklists';
import { INITIAL_RISK_RULES } from './riskRules';
import { NivelRisco, Prioridade, StatusRisco, StatusAcao, StatusInspecao, Pacote, Risco, Acao, Inspecao, Alerta, LogEntry, User, Sector, Organization, RulePackage, RiskRule, ChecklistTemplate, ChecklistSection } from '@/lib/types';

export type Rule = {
  id: string;
  name: string;
  checklistOrigin: string;
  question: string;
  condition: string;
  severity: 'Baixo' | 'MÃ©dio' | 'Alto' | 'CrÃ­tico';
  autoAction: string;
  assignTo: string;
  deadline: string;
  justification: string;
  isActive: boolean;
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
    frequencia: 'DiÃ¡ria' | 'Semanal' | 'Imediata';
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

type AppStore = {
  // Organization
  organization: Organization;
  updateOrganization: (data: Partial<Organization>) => void;

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

  // Trainings
  trainings: any[];
  addTraining: (record: any) => void;

  // Rules
  rules: Rule[];
  addRule: (rule: Omit<Rule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<Rule>) => void;
  deleteRule: (id: string) => void;

  // System Core Data
  acoes: Acao[];
  riscos: Risco[];
  inspecoes: Inspecao[];
  alertas: Alerta[];
  logs: LogEntry[];
  addLog: (log: Omit<LogEntry, 'id' | 'created_at'>) => void;
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
  configuracoes?: any;

  // Motor / Engine
  runEngine: () => void;

  signOut: () => void;
};

// Helper to map NR to Package
export const nrToPackage: Record<string, string> = {
  'NR-32': 'SaÃºde/Hospitalar',
  'NR-18': 'ConstruÃ§Ã£o Civil',
  'NR-35': 'ConstruÃ§Ã£o Civil',
  'NR-12': 'IndÃºstria',
  'NR-10': 'IndÃºstria',
  'NR-20': 'IndÃºstria',
  'NR-11': 'IndÃºstria',
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
  // Legacy function deactivated: automation generation is strictly handled by AutomationEngine.processInspection now.
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
        segmento: 'IndÃºstria',
        atividadesCriticas: ['Trabalho em altura', 'MÃ¡quinas e equipamentos', 'RuÃ­do'],
        porte: 'MÃ©dia',
        tipoOperacao: 'Industrial',
        razaoSocial: 'Larion IndÃºstria Ltda.',
        cnpj: '12.345.678/0001-90',
        telefone: '(11) 3456-7890',
        emailCorporativo: 'contato@larion.com.br',
        endereco: 'Rua das IndÃºstrias, 123, GalpÃ£o A - SÃ£o Paulo/SP'
      },
      updateOrganization: (data) => set((state) => ({ organization: { ...state.organization, ...data } })),

      users: [
        { id: '1', name: 'Rafael Oliveira', role: 'Engenheiro de Seg.', email: 'rafael@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
        { id: '2', name: 'JoÃ£o Silva', role: 'Supervisor Manut.', email: 'joao.s@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d' },
        { id: '3', name: 'Marcos AntÃ´nio', role: 'TÃ©cnico SST', email: 'marcos@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
        { id: '4', name: 'ClÃ¡udia Ramos', role: 'Gerente Op.', email: 'claudia@larion.com', status: 'Inativo', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
      ],
      addUser: (user) => set((state) => ({ users: [...state.users, { ...user, id: crypto.randomUUID() }] })),
      updateUser: (id, user) => set((state) => ({ users: state.users.map((u) => u.id === id ? { ...u, ...user } : u) })),
      deleteUser: (id) => set((state) => ({ users: state.users.filter((u) => u.id !== id) })),

      sectors: [
        { id: 's1', name: 'ManutenÃ§Ã£o' },
        { id: 's2', name: 'ProduÃ§Ã£o (Linha 1)' },
        { id: 's3', name: 'LogÃ­stica' },
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
        { id: 'pkg-base', name: 'Base SST', description: 'Regras essenciais aplicÃ¡veis Ã  maioria das operaÃ§Ãµes.', isActive: true, segment: 'Geral', ruleCount: 14, isLocked: true },
        { id: 'pkg-const', name: 'ConstruÃ§Ã£o Civil', description: 'Regras para obras, altura, andaimes, escavaÃ§Ãµes, mÃ¡quinas e sinalizaÃ§Ã£o de obra.', isActive: false, segment: 'ConstruÃ§Ã£o', ruleCount: 9 },
        { id: 'pkg-ind', name: 'IndÃºstria', description: 'Regras para mÃ¡quinas, manutenÃ§Ã£o, energia, produtos quÃ­micos, ruÃ­do, calor e ergonomia operacional.', isActive: false, segment: 'IndÃºstria', ruleCount: 6 },
        { id: 'pkg-saude', name: 'SaÃºde/Hospitalar', description: 'Regras para risco biolÃ³gico, perfurocortantes, resÃ­duos de saÃºde, higienizaÃ§Ã£o e EPIs especÃ­ficos.', isActive: false, segment: 'SaÃºde', ruleCount: 4 },
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

      trainings: [],
      addTraining: (record) => set((state) => ({ trainings: [...state.trainings, { ...record, id: crypto.randomUUID() }] })),

      rules: [
        {
          id: 'r1',
          name: 'Risco de Prensagem (MÃ¡quina sem protetor)',
          checklistOrigin: 'MÃ¡quinas e Equip.',
          question: 'A proteÃ§Ã£o fixa estÃ¡ instalada?',
          condition: 'NÃƒO',
          severity: 'CrÃ­tico',
          autoAction: 'Bloquear mÃ¡q. e reinstalar proteÃ§Ã£o',
          assignTo: 'Equipe de ManutenÃ§Ã£o ElÃ©trica',
          deadline: 'Imediato (4h)',
          justification: 'ExposiÃ§Ã£o a partes mÃ³veis cortantes.',
          isActive: true,
        }
      ],
      addRule: (rule) => set((state) => ({ rules: [...state.rules, { ...rule, id: crypto.randomUUID(), editavel: true, removivel: true, regraFixa: false } as any] })),
      updateRule: (id, rule) => {
         if (id.startsWith('nr-')) {
            alert('Esta Ã© uma regra fixa do motor e nÃ£o pode ser editada.');
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
            alert('Esta regra Ã© obrigatÃ³ria para o funcionamento do motor normativo.');
            return;
         }
         set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }))
      },

      acoes: [
        {
          id: 'act-1',
          titulo: 'Instalar linha de vida provisÃ³ria',
          descricao: 'Instalar linha de vida e travas de queda no galpÃ£o A antes da pintura.',
          prioridade: 'Alta',
          status: 'Em andamento',
          setor: 'Administrativo',
          responsavel: 'JoÃ£o Silva', // Area owner
          prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progresso: 20,
          origem: 'InspeÃ§Ã£o',
          riscoId: 'r1',
          trabalhadoresExpostos: 2,
          perfilExposto: 'Pintor Predial',
          impactoHumano: 'Queda de nÃ­vel (risco de morte)',
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
          titulo: 'Isolamento de painel elÃ©trico aberto',
          descricao: 'Isolar painel e adequar fechos no quadro principal.',
          prioridade: 'CrÃ­tica',
          status: 'Pendente',
          setor: 'ManutenÃ§Ã£o',
          responsavel: 'Marcos AntÃ´nio',
          prazo: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          progresso: 0,
          origem: 'InspeÃ§Ã£o',
          riscoId: 'r2',
          trabalhadoresExpostos: 1,
          perfilExposto: 'Eletricista NÃ­vel II',
          impactoHumano: 'EletrocussÃ£o',
          executor: 'Contratada ElÃ©trica',
          validador: 'JoÃ£o Silva (Sup. Manut.)',
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
          iniciadoEm: null,
          concluidoEm: null,
          evidencia: [],
          historico: []
        }
      ],
      riscos: [
        applyManualRules({ id: 'r1', atividade: 'Trabalho em altura', setor: 'Operacional', nr: 'NR-35', hasEpiEpc: false, hasProcedimento: false, hasTreinamento: true, status: 'Aberto', trabalhadoresExpostos: 2, perfilExposto: 'Pintor Predial', impactoHumano: 'Queda de nÃ­vel (fraturas graves ou Ã³bito)', executorCorrecao: 'Equipe Especializada NR-35', validadorCorrecao: 'Rafael Oliveira (Eng. Seg.)' }),
        applyManualRules({ id: 'r2', atividade: 'ManutenÃ§Ã£o elÃ©trica', setor: 'ManutenÃ§Ã£o', nr: 'NR-10', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Em anÃ¡lise', trabalhadoresExpostos: 1, perfilExposto: 'Eletricista NÃ­vel II', impactoHumano: 'Choque elÃ©trico (queimaduras ou parada cardÃ­aca)', executorCorrecao: 'Contratada ElÃ©trica', validadorCorrecao: 'JoÃ£o Silva (Sup. Manut.)' }),
        applyManualRules({ id: 'r3', atividade: 'OperaÃ§Ã£o de mÃ¡quinas', setor: 'ProduÃ§Ã£o', nr: 'NR-12', hasEpiEpc: false, hasProcedimento: true, hasTreinamento: true, status: 'Aberto', trabalhadoresExpostos: 5, perfilExposto: 'Operador de Prensa', impactoHumano: 'Prensagem de membros (amputaÃ§Ã£o)', executorCorrecao: 'Equipe de ManutenÃ§Ã£o MecÃ¢nica', validadorCorrecao: 'Marcos AntÃ´nio (TÃ©c. SST)' }),
        applyManualRules({ id: 'r4', atividade: 'Trabalho em altura', setor: 'LogÃ­stica', nr: 'NR-35', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Aberto' }),
        applyManualRules({ id: 'r5', atividade: 'EspaÃ§o confinado', setor: 'ManutenÃ§Ã£o', nr: 'NR-33', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: false, status: 'Aberto', trabalhadoresExpostos: 3, perfilExposto: 'Limpador de Tanques', impactoHumano: 'Asfixia e intoxicaÃ§Ã£o (Ã³bito rÃ¡pido)', executorCorrecao: 'Equipe de Resgate e Limpeza', validadorCorrecao: 'Rafael Oliveira (Eng. Seg.)' }),
        applyManualRules({ id: 'r6', atividade: 'MovimentaÃ§Ã£o de cargas', setor: 'LogÃ­stica', nr: 'NR-11', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Aberto' }),
        applyManualRules({ id: 'r7', atividade: 'Trabalho a quente', setor: 'ManutenÃ§Ã£o', nr: 'NR-34', hasEpiEpc: true, hasProcedimento: false, hasTreinamento: true, status: 'Em anÃ¡lise' }),
        applyManualRules({ id: 'r8', atividade: 'Trabalho em altura', setor: 'Administrativo', nr: 'NR-35', hasEpiEpc: true, hasProcedimento: true, hasTreinamento: true, status: 'Em anÃ¡lise' }),
      ],
      inspecoes: [
        {
          id: 'ins-1',
          tipoInspecao: 'Trabalho em Altura (NR-35)',
          checklist: 'Trabalho em Altura',
          pacote: 'ConstruÃ§Ã£o Civil',
          ondeUsar: 'Ãrea de Estoque Externo',
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
          tipoInspecao: 'SeguranÃ§a Ãrea Fabril',
          checklist: 'SeguranÃ§a Ãrea Fabril',
          pacote: 'Base SST',
          ondeUsar: 'ProduÃ§Ã£o (Linha 1)',
          data: new Date().toISOString().split('T')[0],
          proximaInspecao: new Date().toISOString().split('T')[0],
          responsavel: 'JoÃ£o Silva',
          prioridade: 'MÃ©dia',
          situacao: 'Em andamento',
          status: 'Em andamento',
          trabalhadoresExpostos: 12,
          perfilExposto: 'Operadores de MÃ¡quina / Setor de Ensacagem',
          items: [
            { id: 'q1', status: 'Sim', text: 'O ambiente estÃ¡ limpo e organizado?', riskMap: 'Baixo', pacote: 'Base SST' },
            { id: 'q2', status: 'NÃ£o', text: 'Rotas de fuga desobstruÃ­das?', riskMap: 'CrÃ­tico', pacote: 'Base SST' },
          ]
        },
        {
          id: 'ins-3',
          tipoInspecao: 'ElÃ©trica (NR-10)',
          checklist: 'MÃ¡quinas e Equip.',
          pacote: 'IndÃºstria',
          ondeUsar: 'ManutenÃ§Ã£o',
          data: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          proximaInspecao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          responsavel: 'Marcos AntÃ´nio',
          prioridade: 'Alta',
          situacao: 'Atrasada',
          status: 'Atrasada',
          trabalhadoresExpostos: 2,
          perfilExposto: 'Eletricistas de ManutenÃ§Ã£o',
          items: []
        }
      ],
      alertas: [
        { id: 'a1', type: 'risco_critico', title: 'Risco CrÃ­tico Detectado', description: 'Trabalho em altura sem proteÃ§Ã£o em obra.', status: 'Ativo', severity: 'CrÃ­tico', origin: 'Risco', package: 'ConstruÃ§Ã£o Civil', nr: 'NR-35', createdAt: new Date().toISOString(), link: '/operacao/riscos' },
        { id: 'a2', type: 'acao_vencida', title: 'AÃ§Ã£o Vencida', description: 'RevisÃ£o de proteÃ§Ãµes de mÃ¡quinas atrasada.', status: 'Ativo', severity: 'Alto', origin: 'AÃ§Ã£o', package: 'IndÃºstria', nr: 'NR-12', createdAt: new Date().toISOString(), link: '/operacao/acoes' },
        { id: 'a3', type: 'checklist_pendente', title: 'Checklist Pendente', description: 'InspeÃ§Ã£o de EPIs da saÃºde pendente.', status: 'Ativo', severity: 'MÃ©dio', origin: 'Checklist', package: 'SaÃºde/Hospitalar', nr: 'NR-32', createdAt: new Date().toISOString(), link: '/inspecoes' },
        { id: 'a4', type: 'alerta_geral', title: 'Novo Colaborador', description: 'Novo engenheiro de seguranÃ§a admitido.', status: 'Ativo', severity: 'Baixo', origin: 'Sistema', package: 'Base SST', createdAt: new Date().toISOString(), link: '/configuracoes' },
      ],
      logs: [],
      addLog: (log) => set((state) => ({ logs: [...state.logs, { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }] })),
      addAlerta: (alerta) => set((state) => ({ alertas: [...state.alertas, { ...alerta, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] })),
      updateAlerta: (id, alerta) => set((state) => ({ alertas: state.alertas.map(a => a.id === id ? { ...a, ...alerta } : a) })),
      deleteAlerta: (id) => set((state) => ({ alertas: state.alertas.filter(a => a.id !== id) })),
      addAcao: (acao) => set((state) => {
        const id = acao.id || crypto.randomUUID();
        const newAcao = normalizeActionDraft({ ...acao, id });
        
        // Define package if missing
        if (!newAcao.pacote && !newAcao.package) {
          newAcao.pacote = getPackageFromNr(acao.nr);
        }

        const newLog = {
          id: crypto.randomUUID(),
          empresa_id: acao.empresa_id || '1',
          user_id: acao.responsavel || 'Sistema',
          event_type: 'acao_gerada',
          description: `AÃ§Ã£o gerada: ${acao.title || acao.titulo}`,
          origin_type: 'acao',
          origin_id: id,
          created_at: new Date().toISOString()
        };

        const newAlert: Alerta = {
          id: crypto.randomUUID(),
          type: 'acao_gerada',
          title: 'Nova AÃ§Ã£o Gerada',
          description: `Uma nova aÃ§Ã£o foi gerada: ${acao.title || acao.titulo}`,
          status: 'Ativo',
          severity: acao.prioridade === 'CrÃ­tica' ? 'CrÃ­tico' : (acao.prioridade === 'Alta' ? 'Alto' : 'MÃ©dio'),
          origin: 'AÃ§Ã£o',
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
        const normalizedAcao = normalizeActionDraft({ ...oldAcao, ...acao, id });
        let newLogs = [...state.logs];
        if (oldAcao) {
           if ((oldAcao.status !== 'ConcluÃ­da') && (normalizedAcao.status === 'ConcluÃ­da')) {
              newLogs.push({
                id: crypto.randomUUID(),
                empresa_id: normalizedAcao.empresa_id || oldAcao.empresa_id || '1',
                user_id: normalizedAcao.responsavel || oldAcao.responsavel || 'Sistema',
                event_type: 'acao_concluida',
                description: `AÃ§Ã£o concluÃ­da: ${normalizedAcao.title || oldAcao.title || normalizedAcao.titulo || oldAcao.titulo}`,
                origin_type: 'acao',
                origin_id: id,
                created_at: new Date().toISOString()
              });
           }
        }
        return {
          acoes: state.acoes.map((v) => v.id === id ? normalizedAcao : v),
          logs: newLogs
        };
      }),
      deleteAcao: (id) => set((state) => ({ acoes: state.acoes.filter((v) => v.id !== id) })),
      addRisco: (risco) => {
        set((state) => {
          const normalizedRisco = applyManualRules(risco);
          const id = normalizedRisco.id || crypto.randomUUID();
          const newRisco = { ...normalizedRisco, id };
          
          if (!newRisco.pacote && !newRisco.package) {
            newRisco.pacote = getPackageFromNr(newRisco.nr);
          }

          const newLog = {
            id: crypto.randomUUID(),
            empresa_id: newRisco.empresa_id || '1',
            user_id: newRisco.user_id || newRisco.responsavel || 'Sistema',
            event_type: 'risco_gerado',
            description: `Risco gerado: ${newRisco.title || newRisco.titulo}`,
            origin_type: 'risco',
            origin_id: id,
            created_at: new Date().toISOString()
          };

          const newAlert: Alerta = {
            id: crypto.randomUUID(),
            type: 'risco_gerado',
            title: 'Novo Risco Detectado',
            description: `Um novo risco foi identificado: ${newRisco.title || newRisco.titulo}`,
            status: 'Ativo',
            severity: (newRisco.nivel || 'MÃ©dio') as any,
            origin: 'Risco',
            originId: id,
            package: newRisco.pacote || newRisco.package,
            nr: newRisco.nr,
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
        set((state) => ({
          riscos: state.riscos.map((v) => {
            if (v.id !== id) return v;
            return applyManualRules({ ...v, ...risco, id });
          })
        }));
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
            description: `InspeÃ§Ã£o criada: ${inspecao.title || inspecao.nome || inspecao.titulo}`,
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
                description: `Foram identificados ${inspecao.nonConformities} itens nÃ£o conformes na inspeÃ§Ã£o.`,
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
              description: `InspeÃ§Ã£o editada: ${inspecao.title || oldInspecao.title || inspecao.nome || oldInspecao.nome}`,
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
                 description: `InspeÃ§Ã£o anulada: ${inspecao.title || oldInspecao.title || inspecao.nome || oldInspecao.nome}`,
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
          frequencia: 'DiÃ¡ria',
        },
        economia: {
          enabled: true,
          custoHoraParada: 500,
          numEmpregados: 120,
          fatorReincidencia: 1.2,
        }
      },
      updateEngineConfig: (config) => set((state) => ({ engineConfig: { ...state.engineConfig, ...config } })),

      // Dispara o motor manualmente (rehidrataÃ§Ã£o, mudanÃ§a de configuraÃ§Ã£o, intervalo periÃ³dico)
      runEngine: () => {
         try {
            processAutoActions();
         } catch (err) {
            console.error('[Engine] Erro ao executar motor:', err);
         }
      },

      signOut: () => {
         set({
            users: [],
            acoes: [],
            riscos: [],
            inspecoes: [],
            alertas: [],
            logs: [],
            epi_records: [],
            trainings: [],
            accidents: [],
            incidents: [],
            checklists: [],
            riskRules: [],
            rules: [],
            work_hours: [],
            sectors: [],
         });
         if (typeof window !== 'undefined') window.location.href = '/';
      }
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
         // ApÃ³s rehidratar do localStorage, dispara o motor para
         // sincronizar riscos -> aÃ§Ãµes -> alertas e marcar pendÃªncias em atraso.
         if (typeof window !== 'undefined' && state) {
            // Usa setTimeout para garantir que o estado jÃ¡ foi montado
            setTimeout(() => {
               try {
                  processAutoActions();
                  console.log('[Engine] Motor inicializado apÃ³s rehidrataÃ§Ã£o.');
               } catch (err) {
                  console.error('[Engine] Erro na inicializaÃ§Ã£o:', err);
               }
            }, 100);
         }
      }
    }
  )
);



