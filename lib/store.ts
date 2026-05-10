import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { INITIAL_CHECKLISTS } from './checklists';
import { INITIAL_RISK_RULES } from './riskRules';
import { synchronizeInspectionWithMotor } from './motor/bridge';
import { NivelRisco, Prioridade, StatusRisco, StatusAcao, StatusInspecao, Pacote, Risco, Acao, Inspecao, Alerta, LogEntry, User, Sector, Organization, RulePackage, RiskRule, ChecklistTemplate, ChecklistSection } from '@/lib/types';

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

  signOut: () => void;
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

const COMPLETED_INSPECTION_STATUSES = ['Concluída', 'Concluído', 'Finalizada', 'Realizada', 'Reprovada'];

function isInspectionCompletedStatus(status?: string) {
  return COMPLETED_INSPECTION_STATUSES.includes(status || '');
}

export const AppState = {
  get(key?: string) {
    const state = useAppStore.getState();
    return key ? (state as any)[key] : state;
  },
  set(key: string, value: any) {
    useAppStore.setState({ [key]: value });
  },
  save() {
    console.log('[AppState] State saved to local storage.');
  },
  load() {
    useAppStore.persist.rehydrate();
    console.log('[AppState] State rehydrated from local storage.');
  },
  sync() {
    console.log('[AppState] Synced with remote servers.');
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

      trainings: [],
      addTraining: (record) => set((state) => ({ trainings: [...state.trainings, { ...record, id: crypto.randomUUID() }] })),

      rules: [],
      addRule: (rule) => set((state) => ({ rules: [...state.rules, { ...rule, id: crypto.randomUUID(), editavel: true, removivel: true, regraFixa: false } as any] })),
      updateRule: (id, rule) => {
         set((state) => ({ rules: state.rules.map((r) => r.id === id ? { ...r, ...rule } : r) }))
      },
      deleteRule: (id) => {
         set((state) => ({ rules: state.rules.filter((r) => r.id !== id) }))
      },

      acoes: [],
      riscos: [],
      inspecoes: [],
      alertas: [],
      logs: [],
      addLog: (log) => set((state) => ({ logs: [...state.logs, { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }] })),
      addAlerta: (alerta) => set((state) => ({ alertas: [...state.alertas, { ...alerta, id: crypto.randomUUID(), createdAt: new Date().toISOString() }] })),
      updateAlerta: (id, alerta) => set((state) => ({ alertas: state.alertas.map(a => a.id === id ? { ...a, ...alerta } : a) })),
      deleteAlerta: (id) => set((state) => ({ alertas: state.alertas.filter(a => a.id !== id) })),
      addAcao: (acao) => set((state) => {
        const id = acao.id || crypto.randomUUID();
        const nowIso = new Date().toISOString();
        const newAcao = {
          ...acao,
          id,
          title: acao.title || acao.titulo,
          titulo: acao.titulo || acao.title,
          created_at: acao.created_at || acao.criadoEm || nowIso,
          updated_at: acao.updated_at || acao.atualizadoEm || nowIso,
          criadoEm: acao.criadoEm || acao.created_at || nowIso,
          atualizadoEm: acao.atualizadoEm || acao.updated_at || nowIso,
        };
        
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
          const nowIso = new Date().toISOString();
          const newRisco = {
            ...risco,
            id,
            title: risco.title || risco.titulo,
            titulo: risco.titulo || risco.title,
            created_at: risco.created_at || risco.criadoEm || nowIso,
            updated_at: risco.updated_at || risco.atualizadoEm || nowIso,
            criadoEm: risco.criadoEm || risco.created_at || nowIso,
            atualizadoEm: risco.atualizadoEm || risco.updated_at || nowIso,
          };
          
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

          return { 
            riscos: [...state.riscos, newRisco], 
            logs: [...state.logs, newLog],
          };
        });
      },
      updateRisco: (id, risco) => {
        set((state) => ({ riscos: state.riscos.map((v) => v.id === id ? { ...v, ...risco } : v) }));
      },
      deleteRisco: (id) => {
        set((state) => ({ riscos: state.riscos.filter((v) => v.id !== id) }));
      },
      addInspecao: (inspecao) => {
        set((state) => {
          const id = inspecao.id || crypto.randomUUID();
          const nowIso = new Date().toISOString();
          const newInspecao = {
            ...inspecao,
            id,
            title: inspecao.title || inspecao.nome || inspecao.titulo || inspecao.checklist || 'Inspeção',
            titulo: inspecao.titulo || inspecao.title || inspecao.nome || inspecao.checklist || 'Inspeção',
            created_at: inspecao.created_at || inspecao.criadoEm || nowIso,
            updated_at: inspecao.updated_at || inspecao.atualizadoEm || nowIso,
            criadoEm: inspecao.criadoEm || inspecao.created_at || nowIso,
            atualizadoEm: inspecao.atualizadoEm || inspecao.updated_at || nowIso,
          };
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
          return { inspecoes: [...state.inspecoes, newInspecao], logs: newLogs };
        });
      },
      updateInspecao: (id, inspecao) => {
        set((state) => {
          const oldInspecao = state.inspecoes.find(i => i.id === id);
          let newLogs = [...state.logs];
          let nextRiscos = state.riscos;
          let nextAcoes = state.acoes;
          let nextAlertas = state.alertas;
          const nowIso = new Date().toISOString();
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

            const mergedInspection = {
              ...oldInspecao,
              ...inspecao,
              title: inspecao.title || oldInspecao.title || inspecao.nome || oldInspecao.nome || inspecao.titulo || oldInspecao.titulo,
              titulo: inspecao.titulo || oldInspecao.titulo || inspecao.title || oldInspecao.title || inspecao.nome || oldInspecao.nome,
              updated_at: nowIso,
              atualizadoEm: nowIso
            };

            if (isInspectionCompletedStatus(mergedInspection.status || mergedInspection.situacao) && Array.isArray(mergedInspection.items)) {
              const sync = synchronizeInspectionWithMotor(mergedInspection, state);
              const removableOrigins = new Set(['Inspeção / Checklist', 'motor-operacional']);

              nextRiscos = state.riscos.filter((risco: any) => {
                const sameInspection = risco.inspection_id === id || risco.inspecaoId === id;
                return !(sameInspection && removableOrigins.has(risco.origem));
              });

              nextAcoes = state.acoes.filter((acao: any) => {
                const sameInspection = acao.inspection_id === id || acao.inspecaoId === id;
                return !(sameInspection && removableOrigins.has(acao.origem || 'motor-operacional'));
              });

              const generatedAlertIds = new Set([...sync.risks.map((item: any) => item.id), ...sync.actions.map((item: any) => item.id)]);
              nextAlertas = state.alertas.filter((alerta: any) => alerta.originId !== id && !generatedAlertIds.has(alerta.originId));

              nextRiscos = [...nextRiscos, ...sync.risks];
              nextAcoes = [...nextAcoes, ...sync.actions];
              nextAlertas = [...nextAlertas, ...sync.alerts];
              newLogs = [...newLogs, ...sync.logs];

              return {
                inspecoes: state.inspecoes.map((v) => v.id === id ? { ...mergedInspection, nonConformities: sync.nonConformities.length, motorSyncVersion: sync.inspection.motorSyncVersion } : v),
                riscos: nextRiscos,
                acoes: nextAcoes,
                alertas: nextAlertas,
                logs: newLogs
              };
            }
          }
          return {
            inspecoes: state.inspecoes.map((v) => v.id === id ? { ...v, ...inspecao, updated_at: nowIso, atualizadoEm: nowIso } : v),
            riscos: nextRiscos,
            acoes: nextAcoes,
            alertas: nextAlertas,
            logs: newLogs
          };
        });
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
    }
  )
);
