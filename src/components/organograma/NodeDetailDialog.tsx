import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { OrganogramaNode } from "@/hooks/useOrganograma";
import { Pencil, Trash2 } from "lucide-react";

interface NodeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: OrganogramaNode | null;
  allNodes: OrganogramaNode[];
  projetoNome: string;
  onEdit: (node: OrganogramaNode) => void;
  onDelete: (id: string) => void;
}

export function NodeDetailDialog({ open, onOpenChange, node, allNodes, projetoNome, onEdit, onDelete }: NodeDetailDialogProps) {
  if (!node) return null;

  const superior = node.superior_id ? allNodes.find((n) => n.id === node.superior_id) : null;
  const subordinados = allNodes.filter((n) => n.superior_id === node.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Posição</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2 text-sm">
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Nome</span>
            <div className="font-medium text-foreground">{node.nome_colaborador}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Cargo / Função</span>
            <div className="font-medium text-foreground">{node.cargo}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Projeto</span>
            <div className="font-medium text-foreground">{projetoNome}</div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Superior Direto</span>
            <div className="font-medium text-foreground">
              {superior ? `${superior.nome_colaborador} — ${superior.cargo}` : "Nenhum (raiz)"}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground text-xs uppercase tracking-wide">Subordinados</span>
            {subordinados.length === 0 ? (
              <div className="text-muted-foreground">Nenhum</div>
            ) : (
              <ul className="mt-1 space-y-1">
                {subordinados.map((s) => (
                  <li key={s.id} className="text-foreground">
                    {s.nome_colaborador} — {s.cargo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(node); }}>
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => { onDelete(node.id); onOpenChange(false); }}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
