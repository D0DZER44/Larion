import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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
  status: 'Ativo' | 'Rascunho' | 'Inativo';
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

  // Rules
  rules: Rule[];
  addRule: (rule: Omit<Rule, 'id'>) => void;
  updateRule: (id: string, rule: Partial<Rule>) => void;
  deleteRule: (id: string) => void;

  // Checklists
  checklists: ChecklistTemplate[];
  addChecklist: (checklist: Omit<ChecklistTemplate, 'id'>) => void;
  updateChecklist: (id: string, checklist: Partial<ChecklistTemplate>) => void;
  deleteChecklist: (id: string) => void;
  
  // Config
  engineConfig: EngineConfig;
  updateEngineConfig: (config: Partial<EngineConfig>) => void;
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      users: [
        { id: '1', name: 'Rafael Oliveira', role: 'Engenheiro de Seg.', email: 'rafael@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' },
        { id: '2', name: 'João Silva', role: 'Supervisor Manut.', email: 'joao.s@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d' },
        { id: '3', name: 'Marcos Antônio', role: 'Técnico SST', email: 'marcos@larion.com', status: 'Ativo', avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d' },
        { id: '4', name: 'Cláudia Ramos', role: 'Gerente Op.', email: 'claudia@larion.com', status: 'Inativo', avatar: 'https://i.pravatar.cc/150?u=a04258114e29026302d' },
      ],
      addUser: (user) => set((state) => ({ users: [...state.users, { ...user, id: Date.now().toString() }] })),
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
      addSector: (sector) => set((state) => ({ sectors: [...state.sectors, { ...sector, id: Date.now().toString() }] })),
      updateSector: (id, name) => set((state) => ({ sectors: state.sectors.map((s) => s.id === id ? { ...s, name } : s) })),
      deleteSector: (id) => set((state) => ({ sectors: state.sectors.filter((s) => s.id !== id) })),
      reorderSectors: (sectors) => set({ sectors }),

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
      addRule: (rule) => set((state) => ({ rules: [...state.rules, { ...rule, id: Date.now().toString() }] })),
      updateRule: (id, rule) => set((state) => ({ rules: state.rules.map((r) => r.id === id ? { ...r, ...rule } : r) })),
      deleteRule: (id) => set((state) => ({ rules: state.rules.filter((r) => r.id !== id) })),

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
        { id: 'c2', name: 'Máquinas e Equip.', category: 'Equipamentos', status: 'Ativo', sections: [] },
        { id: 'c3', name: 'Inspeção de EPI', category: 'EPI', status: 'Rascunho', sections: [] },
        { id: 'c4', name: 'Trabalho em Altura', category: 'Segurança', status: 'Ativo', sections: [] },
      ],
      addChecklist: (checklist) => set((state) => ({ checklists: [...state.checklists, { ...checklist, id: Date.now().toString() }] })),
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

