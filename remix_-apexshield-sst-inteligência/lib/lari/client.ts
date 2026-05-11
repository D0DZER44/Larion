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
  const fallbackResponse: LariMessage = {
    id: crypto.randomUUID(),
    role: 'lari',
    text: `Estou offline. Mas aqui estão seus dados operacionais no momento:\n- Riscos Críticos: ${context.criticalRisks}\n- Ações Atrasadas: ${context.acoesAtrasadas}\n- Inspeções Pendentes: ${context.inspecoesPendentes}\n- Conformidade: ${context.conformidade}%`,
    isOffline: true
  };

  try {
    const response = await fetch('/api/lari', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, context })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro na consulta à L.A.R.I API:", error);
    return fallbackResponse;
  }
}
