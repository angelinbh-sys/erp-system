import React from "react";
import type { OrganogramaNode } from "@/hooks/useOrganograma";

interface OrgNodeCardProps {
  node: OrganogramaNode;
  onClick: (node: OrganogramaNode) => void;
}

export function OrgNodeCard({ node, onClick }: OrgNodeCardProps) {
  return (
    <button
      onClick={() => onClick(node)}
      className="group min-w-[180px] max-w-[220px] rounded-xl border-2 border-border/60 bg-card px-4 py-3 shadow-md hover:shadow-lg hover:border-primary/40 transition-all text-left cursor-pointer"
    >
      <div className="text-sm font-semibold text-foreground leading-tight truncate">
        {node.nome_colaborador}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5 truncate">
        {node.cargo}
      </div>
    </button>
  );
}
