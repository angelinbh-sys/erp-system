import React, { useMemo } from "react";
import type { OrganogramaNode } from "@/hooks/useOrganograma";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { UserRound } from "lucide-react";

interface FlatRow {
  level: number;
  node: OrganogramaNode;
  superiorName: string;
}

function buildFlatRows(
  nodes: OrganogramaNode[],
  projetoNome: string,
): FlatRow[] {
  const byId = new Map<string, OrganogramaNode>();
  nodes.forEach((n) => byId.set(n.id, n));

  const childrenOf = new Map<string | null, OrganogramaNode[]>();
  nodes.forEach((n) => {
    const key = n.superior_id ?? null;
    if (!childrenOf.has(key)) childrenOf.set(key, []);
    childrenOf.get(key)!.push(n);
  });

  const rows: FlatRow[] = [];

  function walk(parentId: string | null, level: number) {
    const children = childrenOf.get(parentId) ?? [];
    children.forEach((node) => {
      const sup = node.superior_id ? byId.get(node.superior_id) : null;
      const superiorName = sup
        ? sup.nome_colaborador || sup.cargo
        : "—";
      rows.push({ level, node, superiorName });
      walk(node.id, level + 1);
    });
  }

  walk(null, 1);
  return rows;
}

interface OrgTableProps {
  nodes: OrganogramaNode[];
  projetoNome: string;
  siteContrato?: string;
}

export function OrgTable({ nodes, projetoNome, siteContrato }: OrgTableProps) {
  const rows = useMemo(() => buildFlatRows(nodes, projetoNome), [nodes, projetoNome]);

  if (rows.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Nível</TableHead>
          <TableHead>Função / Cargo</TableHead>
          <TableHead>Colaborador</TableHead>
          <TableHead>Superior Direto</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const hasColab = !!r.node.colaborador_id && !!r.node.nome_colaborador;
          return (
            <TableRow key={r.node.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {r.level}
              </TableCell>
              <TableCell>
                <div style={{ paddingLeft: `${(r.level - 1) * 20}px` }} className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{r.node.cargo}</span>
                </div>
              </TableCell>
              <TableCell>
                {hasColab ? (
                  <span className="text-sm text-foreground">{r.node.nome_colaborador}</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <UserRound className="h-3 w-3" />
                    Vaga aberta
                  </span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{r.superiorName}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{projetoNome || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{siteContrato || "—"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
