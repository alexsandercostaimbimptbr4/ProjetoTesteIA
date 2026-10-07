import {
  BarChart3,
  Filter,
  LayoutDashboard,
  ListChecks,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

const COMING_SOON = [
  { label: "Contatos", icon: Users },
  { label: "Funil de vendas", icon: Filter },
  { label: "Tarefas", icon: ListChecks },
  { label: "Relatórios", icon: BarChart3 },
];

export function Sidebar() {
  return (
    <nav
      aria-label="Principal"
      className="flex h-full w-64 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground"
    >
      <p className="px-2 text-lg font-semibold">Painel CRM</p>
      <ul className="grid gap-1 text-sm">
        <li>
          <Link
            href="/dashboard"
            aria-current="page"
            className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-2 py-2 font-medium text-sidebar-accent-foreground"
          >
            <LayoutDashboard className="size-4" aria-hidden />
            Visão geral
          </Link>
        </li>
        {COMING_SOON.map(({ label, icon: Icon }) => (
          <li
            key={label}
            className="flex items-center gap-2 rounded-lg px-2 py-2 text-muted-foreground"
          >
            <Icon className="size-4" aria-hidden />
            <span aria-disabled="true">{label}</span>
            <Badge variant="outline" className="ml-auto">
              em breve
            </Badge>
          </li>
        ))}
      </ul>
    </nav>
  );
}
