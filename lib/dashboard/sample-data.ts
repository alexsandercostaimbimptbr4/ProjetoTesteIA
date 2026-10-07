import { getCurrentUser } from "@/lib/auth/current-user";

export type Stat = { id: string; label: string; value: string; change: string };

export type Activity = { id: string; description: string; when: string };

// Demo data only. When the real CRM modules exist, this function is the one
// place to replace with database queries. It checks the session itself: a
// layout does not stop a page from rendering, so data access is the gate.
export async function getDashboardData(): Promise<{
  stats: Stat[];
  activities: Activity[];
}> {
  await getCurrentUser();

  return {
    stats: [
      {
        id: "contacts",
        label: "Total de contatos",
        value: "1.248",
        change: "+12% no mês",
      },
      {
        id: "open-deals",
        label: "Negócios em aberto",
        value: "37",
        change: "+5 nesta semana",
      },
      {
        id: "revenue",
        label: "Receita do mês",
        value: "R$ 84.500",
        change: "+8% no mês",
      },
      {
        id: "conversion",
        label: "Taxa de conversão",
        value: "23%",
        change: "+2 pontos no mês",
      },
    ],
    activities: [
      {
        id: "1",
        description: "Novo contato cadastrado: Mariana Lopes",
        when: "há 10 minutos",
      },
      {
        id: "2",
        description: "Negócio \"Plano Anual - Padaria Sol\" avançou para Proposta",
        when: "há 1 hora",
      },
      {
        id: "3",
        description: "Tarefa concluída: ligar para Carlos Mendes",
        when: "há 3 horas",
      },
      {
        id: "4",
        description: "Negócio \"Consultoria - Grupo Atlas\" foi ganho",
        when: "ontem",
      },
      {
        id: "5",
        description: "Reunião agendada com Fernanda Rocha",
        when: "ontem",
      },
    ],
  };
}
