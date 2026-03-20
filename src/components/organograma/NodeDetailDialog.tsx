import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OrganogramaNode } from "@/hooks/useOrganograma";
import { Pencil, Trash2, UserPlus, UserMinus, AlertTriangle, ArrowDown, ArrowUp } from "lucide-react";

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
}

interface NodeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  node: OrganogramaNode | null;
  allNodes: OrganogramaNode[];
  projetoNome: string;
  onEdit: (node: OrganogramaNode) => void;
  onDelete: (id: string) => void;
  onLinkColaborador: (nodeId: string, colaboradorId: string, nomeColaborador: string) => void;
  onUnlinkColaborador: (nodeId: string) => void;
  colaboradores: Colaborador[];
  onAddBelow?: (parentNode: OrganogramaNode) => void;
  onAddAbove?: (childNode: OrganogramaNode) => void;
}

export function NodeDetailDialog({
  open,
  onOpenChange,
  node,
  allNodes,
  projetoNome,
  onEdit,
  onDelete,
  onLinkColaborador,
  onUnlinkColaborador,
  colaboradores,
}: NodeDetailDialogProps) {
  const [linking, setLinking] = useState(false);
  const [searchColab, setSearchColab] = useState("");

  if (!node) return null;

  const superior = node.superior_id ? allNodes.find((n) => n.id === node.superior_id) : null;
  const subordinados = allNodes.filter((n) => n.superior_id === node.id);
  const hasColaborador = !!node.colaborador_id && !!node.nome_colaborador;

  const handleOpenLink = () => {
    setLinking(true);
    setSearchColab("");
  };

  const handleClose = () => {
    setLinking(false);
    setSearchColab("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Detalhes da Posição</DialogTitle>
        </DialogHeader>

        {!linking ? (
          <>
            <div className="space-y-3 py-2 text-sm">
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Cargo / Função</span>
                <div className="font-medium text-foreground">{node.cargo}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Colaborador Vinculado</span>
                {hasColaborador ? (
                  <div className="font-medium text-foreground">{node.nome_colaborador}</div>
                ) : (
                  <div className="text-amber-600 dark:text-amber-400 text-xs italic">Nenhum colaborador vinculado</div>
                )}
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Projeto</span>
                <div className="font-medium text-foreground">{projetoNome}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Superior Direto</span>
                <div className="font-medium text-foreground">
                  {superior
                    ? `${superior.nome_colaborador || superior.cargo}${superior.nome_colaborador ? ` — ${superior.cargo}` : ""}`
                    : "Nenhum (raiz)"}
                </div>
              </div>
              {node.observacao && (
                <div>
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">Observação</span>
                  <div className="text-foreground">{node.observacao}</div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground text-xs uppercase tracking-wide">Subordinados</span>
                {subordinados.length === 0 ? (
                  <div className="text-muted-foreground">Nenhum</div>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {subordinados.map((s) => (
                      <li key={s.id} className="text-foreground">
                        {s.nome_colaborador ? `${s.nome_colaborador} — ${s.cargo}` : s.cargo}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <DialogFooter className="flex flex-wrap gap-2">
              {hasColaborador ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUnlinkColaborador(node.id)}
                >
                  <UserMinus className="h-4 w-4 mr-1" /> Desvincular
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={handleOpenLink}>
                <UserPlus className="h-4 w-4 mr-1" /> {hasColaborador ? "Trocar" : "Vincular"} Colaborador
              </Button>
              <Button variant="outline" size="sm" onClick={() => { handleClose(); onEdit(node); }}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={() => { onDelete(node.id); handleClose(); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            </DialogFooter>
          </>
        ) : (
          <LinkColaboradorView
            node={node}
            colaboradores={colaboradores}
            searchColab={searchColab}
            setSearchColab={setSearchColab}
            onSelect={(col) => {
              onLinkColaborador(node.id, col.id, col.nome);
              setLinking(false);
            }}
            onCancel={() => setLinking(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LinkColaboradorView({
  node,
  colaboradores,
  searchColab,
  setSearchColab,
  onSelect,
  onCancel,
}: {
  node: OrganogramaNode;
  colaboradores: Colaborador[];
  searchColab: string;
  setSearchColab: (v: string) => void;
  onSelect: (col: Colaborador) => void;
  onCancel: () => void;
}) {
  const filtered = useMemo(() => {
    const sorted = [...colaboradores].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
    if (!searchColab.trim()) return sorted;
    const term = searchColab.toLowerCase();
    return sorted.filter(
      (c) => c.nome.toLowerCase().includes(term) || c.cargo.toLowerCase().includes(term)
    );
  }, [colaboradores, searchColab]);

  return (
    <div className="space-y-3 py-2">
      <p className="text-sm text-muted-foreground">
        Selecione um colaborador ativo para vincular à posição <strong>{node.cargo}</strong>:
      </p>
      <Input
        placeholder="Buscar por nome ou cargo..."
        value={searchColab}
        onChange={(e) => setSearchColab(e.target.value)}
        autoFocus
      />
      <ScrollArea className="max-h-56 border rounded-md">
        <div className="p-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-xs text-muted-foreground text-center">Nenhum colaborador encontrado.</div>
          ) : (
            filtered.map((c) => {
              const cargoDivergente = c.cargo.toLowerCase() !== node.cargo.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted transition-colors"
                  onClick={() => onSelect(c)}
                >
                  <div className="font-medium">{c.nome}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {c.cargo}
                    {cargoDivergente && (
                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 ml-1">
                        <AlertTriangle className="h-3 w-3" /> Cargo diferente
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onCancel}>Voltar</Button>
      </div>
    </div>
  );
}
