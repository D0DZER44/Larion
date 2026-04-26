"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// ---------------------------------------------------------
// 1. Definições de Tipos (O "Esqueleto" do Sistema)
// ---------------------------------------------------------

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  active: boolean;
}

export interface Setor {
  id: string;
  empresaId: string;
  nome: string;
  nivelRisco: string;
  funcionarios: number;
}

export interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
  setorId: string;
  status: string;
}

export interface ValorFinanceiro {
  valor: number;
  moeda: string;
}

export interface Risco {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  tipo: 'Físico' | 'Químico' | 'Biológico' | 'Ergonômico' | 'Acidente';
  nivel: 'Baixo' | 'Médio' | 'Alto' | 'Crítico';
  setorId: string;
  status: 'Controlado' | 'Em mitigação' | 'Pendente';
  multaPotencial: ValorFinanceiro;
}

export interface Inspecao {
  id: string;
  titulo: string;
  data: string;
  setorId: string;
  inspetor: string;
  status: 'Concluída' | 'Em Andamento' | 'Programada' | 'Atrasada';
  score: number;
  riscosIdentificados: string[]; // IDs of Riscos
}

export interface Acao {
  id: string;
  titulo: string;
  descricao: string;
  riscoId?: string;
  inspecaoId?: string;
  responsavel: string;
  prazo: string;
  status: 'Em aberto' | 'Em andamento' | 'Concluída' | 'Atrasada';
  prioridade: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  progresso: number;
}

export interface Relatorio {
  id: string;
  titulo: string;
  data: string;
  tipo: string;
  url: string;
}

export interface Regra {
  id: string;
  nome: string;
  condicao: string;
  acao: string;
  active: boolean;
}

export interface ParametrosEconomicos {
  fap: number;
  rat: number;
  multasPrevistas: number;
  savingEstimado: number;
  custoAfastamentos: number;
}

export interface Configuracoes {
  tema: 'light' | 'dark' | 'system';
  notificacoesAtivas: boolean;
  alertasCriticidade: boolean;
}

// ---------------------------------------------------------
// 2. O Estado Central Global (Cérebro de Dados)
// ---------------------------------------------------------

export interface AppState {
  empresas: Empresa[];
  setores: Setor[];
  colaboradores: Colaborador[];
  riscos: Risco[];
  inspecoes: Inspecao[];
  acoes: Acao[];
  relatorios: Relatorio[];
  regras: Regra[];
  parametrosEconomicos: ParametrosEconomicos;
  configuracoes: Configuracoes;
}

// ---------------------------------------------------------
// 3. Estado Inicial Mockado (Será substituído na integração)
// ---------------------------------------------------------

const initialState: AppState = {
  empresas: [
    { id: 'emp-1', nome: 'ApexShield Corp', cnpj: '00.000.000/0001-00', active: true }
  ],
  setores: [],
  colaboradores: [],
  riscos: [],
  inspecoes: [],
  acoes: [],
  relatorios: [],
  regras: [],
  parametrosEconomicos: {
    fap: 1.0,
    rat: 2.0,
    multasPrevistas: 0,
    savingEstimado: 0,
    custoAfastamentos: 0
  },
  configuracoes: {
    tema: 'dark',
    notificacoesAtivas: true,
    alertasCriticidade: true
  }
};

// ---------------------------------------------------------
// 4. Ações do Reducer (Para manipular o cérebro)
// ---------------------------------------------------------

type Action = 
  | { type: 'SET_STATE'; payload: Partial<AppState> }
  // Riscos
  | { type: 'ADD_RISCO'; payload: Risco }
  | { type: 'UPDATE_RISCO'; payload: Risco }
  | { type: 'DELETE_RISCO'; payload: string }
  // Ações
  | { type: 'ADD_ACAO'; payload: Acao }
  | { type: 'UPDATE_ACAO'; payload: Acao }
  | { type: 'DELETE_ACAO'; payload: string }
  // Inspeções
  | { type: 'ADD_INSPECAO'; payload: Inspecao }
  | { type: 'UPDATE_INSPECAO'; payload: Inspecao }
  // Configurações
  | { type: 'UPDATE_CONFIG'; payload: Partial<Configuracoes> };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return { ...state, ...action.payload };
    
    // Riscos
    case 'ADD_RISCO':
      return { ...state, riscos: [...state.riscos, action.payload] };
    case 'UPDATE_RISCO':
      return {
        ...state,
        riscos: state.riscos.map(r => r.id === action.payload.id ? action.payload : r)
      };
    case 'DELETE_RISCO':
      return {
        ...state,
        riscos: state.riscos.filter(r => r.id !== action.payload)
      };

    // Ações
    case 'ADD_ACAO':
      return { ...state, acoes: [...state.acoes, action.payload] };
    case 'UPDATE_ACAO':
      return {
        ...state,
        acoes: state.acoes.map(a => a.id === action.payload.id ? action.payload : a)
      };
    case 'DELETE_ACAO':
      return { ...state, acoes: state.acoes.filter(a => a.id !== action.payload) };

    // Inspeções
    case 'ADD_INSPECAO':
      return { ...state, inspecoes: [...state.inspecoes, action.payload] };
    case 'UPDATE_INSPECAO':
      return {
        ...state,
        inspecoes: state.inspecoes.map(i => i.id === action.payload.id ? action.payload : i)
      };

    // Configurações
    case 'UPDATE_CONFIG':
      return { ...state, configuracoes: { ...state.configuracoes, ...action.payload } };

    default:
      return state;
  }
}

// ---------------------------------------------------------
// 5. Contexto e Providers
// ---------------------------------------------------------

const AppContext = createContext<{ state: AppState; dispatch: React.Dispatch<Action> } | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
