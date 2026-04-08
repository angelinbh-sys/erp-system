import React from "react";
import type { OrganogramaNode } from "@/hooks/useOrganograma";
import { UserRound } from "lucide-react";

interface OrgNodeCardProps {
  node: OrganogramaNode;
  depth: number;
  onClick: (node: OrganogramaNode) => void;
}

const LEVEL_STYLES: { bg: string; border: string; accent: string }[] = [
  { bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-400", accent: "bg-blue-500" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-400", accent: "bg-emerald-500" },
  { bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-400", accent: "bg-amber-500" },
  { bg: "bg-purple-50 dark:bg-purple-950/40", border: "border-purple-400", accent: "bg-purple-500" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-400", accent: "bg-rose-500" },
  { bg: "bg-teal-50 dark:bg-teal-950/40", border: "border-teal-400", accent: "bg-teal-500" },
];

export function OrgNodeCard({ node, depth, onClick }: OrgNodeCardProps) {
  const style = LEVEL_STYLES[depth % LEVEL_STYLES.length];
  const hasColaborador = !!node.colaborador_id && !!node.nome_colaborador;

  return (
    <button
      onClick={() => onClick(node)}
      className={`group relative min-w-[220px] max-w-[300px] rounded-xl border-2 ${style.border} ${style.bg} px-4 py-3 shadow-md hover:shadow-lg transition-all text-left cursor-pointer`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.accent}`} />
      {hasColaborador ? (
        <>
          <div className="text-sm font-semibold text-foreground leading-tight truncate">
            {node.nome_colaborador}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 truncate">
            {node.cargo}
          </div>
        </>
      ) : (
        <>
          <div className="text-sm font-semibold text-foreground leading-tight truncate">
            {node.cargo}
          </div>
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 mt-1">
            <UserRound className="h-3 w-3" />
            <span className="truncate">Vaga sem colaborador vinculado</span>
          </div>
        </>
      )}
    </button>
  );
}
