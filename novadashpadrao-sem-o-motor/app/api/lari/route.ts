import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        id: crypto.randomUUID(),
        role: 'lari',
        text: `Estou offline. Mas aqui estão seus dados operacionais no momento:\n- Riscos Críticos: ${context.criticalRisks}\n- Ações Atrasadas: ${context.acoesAtrasadas}\n- Inspeções Pendentes: ${context.inspecoesPendentes}\n- Conformidade: ${context.conformidade}%`,
        isOffline: true
      });
    }

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

    return NextResponse.json({
      id: crypto.randomUUID(),
      role: 'lari',
      text: response.text,
      isOffline: false
    });

  } catch (error) {
    console.error("Erro na API L.A.R.I route:", error);
    return NextResponse.json({
      id: crypto.randomUUID(),
      role: 'lari',
      text: 'Ocorreu um erro ao conectar: não foi possível processar sua mensagem.',
      isOffline: true
    });
  }
}
