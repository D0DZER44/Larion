import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  name: string;
  category: string;
  status: 'Ativo' | 'Rascunho' | 'Inativo' | 'Revisar';
  proximaRevisao?: string;
  sections: ChecklistSection[];
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
  alertas: any[];
  logs: SystemLog[];
  addLog: (log: Omit<SystemLog, 'id' | 'created_at'>) => void;
  addAcao: (acao: any) => void;
  updateAcao: (id: string, acao: any) => void;
  deleteAcao: (id: string) => void;
  addRisco: (risco: any) => void;
  updateRisco: (id: string, risco: any) => void;
  addInspecao: (inspecao: any) => void;
  updateInspecao: (id: string, inspecao: any) => void;
  deleteInspecao: (id: string) => void;

  // Checklists
  checklists: ChecklistTemplate[];
  addChecklist: (checklist: Omit<ChecklistTemplate, 'id'>) => void;
  updateChecklist: (id: string, checklist: Partial<ChecklistTemplate>) => void;
  deleteChecklist: (id: string) => void;
  
  // Config
  engineConfig: EngineConfig;
  updateEngineConfig: (config: Partial<EngineConfig>) => void;
};

let processingAutoActions = false;

const processAutoActions = () => {
  if (typeof window === 'undefined') return;
  if (processingAutoActions) return;
  processingAutoActions = true;

  try {
    const state = useAppStore.getState();
    const { riscos, inspecoes, acoes, addAcao } = state;
    if (!riscos || !inspecoes || !acoes) return;

    let changes = 0;

    // Processar Riscos
    riscos.forEach(r => {
      const isCritical = r.nivel === 'Crítico' || r.level === 'Crítico' || r.nivel === 'Crítico' || r.nivel === 'Alto' || r.level === 'Alto';
      if (isCritical && r.status !== 'Resolvido' && r.status !== 'Mitigado') {
        const existingAcao = acoes.find(a => a.item_origem_id === r.id && a.item_origem_tipo === 'risco');
        if (!existingAcao && !r.autoActionCreated) {
          const isP1 = r.nivel === 'Crítico' || r.level === 'Crítico';
          const prazo = new Date();
          prazo.setDate(prazo.getDate() + (isP1 ? 1 : 3)); // 1 day for P1, 3 days for P2

          addAcao({
            id: `auto-acao-risco-${r.id || crypto.randomUUID()}`,
            title: `Mitigar Risco Automático: ${r.title || r.atividade || r.setor || 'Não especificado'}`,
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

    // Processar Inspeções
    inspecoes.forEach(i => {
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
      addRule: (rule) => set((state) => ({ rules: [...state.rules, { ...rule, id: crypto.randomUUID() }] })),
      updateRule: (id, rule) => set((state) => ({ rules: state.rules.map((r) => r.id === id ? { ...r, ...rule } : r) })),
      deleteRule: (id) => set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),

      acoes: [],
      riscos: [],
      inspecoes: [],
      alertas: [],
      logs: [],
      addLog: (log) => set((state) => ({ logs: [...state.logs, { ...log, id: crypto.randomUUID(), created_at: new Date().toISOString() }] })),
      addAcao: (acao) => set((state) => {
        const id = acao.id || crypto.randomUUID();
        const newAcao = { ...acao, id };
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
        return { acoes: [...state.acoes, newAcao], logs: [...state.logs, newLog] };
      }),
      updateAcao: (id, acao) => set((state) => {
        const oldAcao = state.acoes.find(a => a.id === id);
        let newLogs = [...state.logs];
        if (oldAcao) {
           if ((oldAcao.status !== 'Concluído' && oldAcao.status !== 'Fechada') && (acao.status === 'Concluído' || acao.status === 'Fechada')) {
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
          return { riscos: [...state.riscos, newRisco], logs: [...state.logs, newLog] };
        });
        useAppStore.getState().engineConfig && processAutoActions();
      },
      updateRisco: (id, risco) => {
        set((state) => ({ riscos: state.riscos.map((v) => v.id === id ? { ...v, ...risco } : v) }));
        processAutoActions();
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

      checklists: [
        {
          id: 'c1',
          name: 'Segurança Área Fabril',
          category: 'Segurança Geral',
          status: 'Ativo',
          sections: [
            {
              id: 'sec1',
              title: '1. Condições do Ambiente',
              questions: [
                { id: 'q1', text: 'O ambiente está limpo e organizado?', type: 'Sim / Não', riskMap: 'Baixo' },
                { id: 'q2', text: 'Rotas de fuga desobstruídas?', type: 'Sim / Não', riskMap: 'Crítico' },
                { id: 'q3', text: 'Sinalizações legíveis?', type: 'Escala 1-5', riskMap: 'Médio' },
              ]
            }
          ]
        },
        { id: 'c2', name: 'Máquinas e Equip.', category: 'Equipamentos', status: 'Ativo', sections: [
          {
            id: 'sec1-c2',
            title: '1. Proteções Físicas',
            questions: [
              { id: 'q1-c2', text: 'As partes móveis estão protegidas?', type: 'Sim / Não', riskMap: 'Crítico' },
              { id: 'q2-c2', text: 'O botão de emergência está acessível e funcionando?', type: 'Sim / Não', riskMap: 'Crítico' },
            ]
          }
        ] },
        { id: 'c3', name: 'Inspeção de EPI', category: 'EPI', status: 'Rascunho', sections: [
          {
            id: 'sec1-c3',
            title: '1. Conservação e Uso',
            questions: [
              { id: 'q1-c3', text: 'EPIs em bom estado de conservação?', type: 'Sim / Não', riskMap: 'Médio' },
              { id: 'q2-c3', text: 'Os colaboradores estão utilizando corretamente?', type: 'Sim / Não', riskMap: 'Alta' },
            ]
          }
        ] },
        { id: 'c4', name: 'Trabalho em Altura', category: 'Segurança', status: 'Ativo', sections: [
          {
            id: 'sec1-c4',
            title: '1. Documentação e Preparação',
            questions: [
              { id: 'q1-c4', text: 'Existe Permissão de Trabalho (PT) válida?', type: 'Sim / Não', riskMap: 'Crítico' },
              { id: 'q2-c4', text: 'Os pontos de ancoragem foram validados?', type: 'Sim / Não', riskMap: 'Crítico' },
              { id: 'q3-c4', text: 'EPIs específicos (cinto, talabarte) conferidos?', type: 'Sim / Não', riskMap: 'Alta' },
            ]
          }
        ] },
      ],
      addChecklist: (checklist) => set((state) => ({ checklists: [...state.checklists, { ...checklist, id: crypto.randomUUID() }] })),
      updateChecklist: (id, checklist) => set((state) => ({ checklists: state.checklists.map((c) => c.id === id ? { ...c, ...checklist } : c) })),
      deleteChecklist: (id) => set((state) => ({ checklists: state.checklists.filter((c) => c.id !== id) })),
      
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

