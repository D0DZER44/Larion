import { GoogleGenAI } from '@google/genai';

export interface LariContext {
  summary: string;
  criticalRisks: number;
  acoesAtrasadas: number;
  inspecoesPendentes: number;
  operationalScore: number;
  topSector: string;
  conformidade: number;
  checklistsHoje: number;
  [key: string]: any;
}

export interface LariMessage {
  id: string;
  role: 'user' | 'lari';
  text: string;
  contextData?: string;
  isOffline?: boolean;
}

export async function askLari(message: string, context: LariContext): Promise<LariMessage> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  const fallbackResponse: LariMessage = {
    id: crypto.randomUUID(),
    role: 'lari',
    text: `Estou offline. Mas aqui estão seus dados operacionais no momento:\n- Riscos Críticos: ${context.criticalRisks}\n- Ações Atrasadas: ${context.acoesAtrasadas}\n- Inspeções Pendentes: ${context.inspecoesPendentes}\n- Conformidade: ${context.conformidade}%`,
    isOffline: true
  };

  if (!apiKey) {
    return fallbackResponse;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = `Você é a L.A.R.I, a Inteligência Artificial e copiloto de SST da plataforma Apex Ops.
Você responde de forma profissional, direta, e ajuda na gestão de riscos e Segurança do Trabalho.

DADOS REAIS EM TEMPO REAL:
${context.summary}
- Riscos Críticos: ${context.criticalRisks}
- Ações Atrasadas: ${context.acoesAtrasadas} 
- Inspeções Pendentes: ${context.inspecoesPendentes}
- Score Operacional: ${context.operationalScore}
- Setor mais crítico: ${context.topSector}
- Conformidade: ${context.conformidade}%
- Checklists do Dia: ${context.checklistsHoje}

Responda à requisição do usuário com base nesses dados operacionais. Se for uma pergunta sobre segurança, normativas (NRs) ou SST, pode responder. Se não tiver nada a ver com SST ou o contexto acima, seja educada mas foque em seu domínio de operação. Formate em Markdown.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.3
      }
    });

    if (!response.text) throw new Error('No text returned');

    return {
      id: crypto.randomUUID(),
      role: 'lari',
      text: response.text,
      isOffline: false
    };

  } catch (error) {
    console.error("Erro na API L.A.R.I:", error);
    return fallbackResponse;
  }
}
