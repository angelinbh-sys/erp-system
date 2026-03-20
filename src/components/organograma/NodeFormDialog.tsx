import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrganogramaNode } from "@/hooks/useOrganograma";

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    cargo: string;
    nome_colaborador: string;
    superior_id: string | null;
    colaborador_id: string | null;
    quantidade: number;
    observacao: string | null;
  }) => void;
  editingNode?: OrganogramaNode | null;
  existingNodes: OrganogramaNode[];
  cargos: { id: string; nome: string }[];
  presetSuperiorId?: string | null;
}

export function NodeFormDialog({
  open,
  onOpenChange,
  onSave,
  editingNode,
  existingNodes,
  cargos,
  presetSuperiorId,
}: NodeFormDialogProps) {
  const [cargo, setCargo] = useState("");
  const [superiorId, setSuperiorId] = useState<string>("none");
  const [quantidade, setQuantidade] = useState("1");
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (editingNode) {
      setCargo(editingNode.cargo);
      setSuperiorId(editingNode.superior_id || "none");
      setQuantidade(String(editingNode.quantidade ?? 1));
      setObservacao(editingNode.observacao ?? "");
    } else {
      setCargo("");
      setSuperiorId(presetSuperiorId ?? "none");
      setQuantidade("1");
      setObservacao("");
    }
  }, [editingNode, open, presetSuperiorId]);

  const possibleSuperiors = existingNodes.filter((n) => !editingNode || n.id !== editingNode.id);

  const handleSubmit = () => {
    if (!cargo.trim()) return;
    onSave({
      cargo: cargo.trim(),
      nome_colaborador: editingNode?.nome_colaborador ?? "",
      superior_id: superiorId === "none" ? null : superiorId,
      colaborador_id: editingNode?.colaborador_id ?? null,
      quantidade: Math.max(1, parseInt(quantidade) || 1),
      observacao: observacao.trim() || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingNode ? "Editar Posição" : "Adicionar Posição"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cargo / Função *</Label>
            <Select value={cargo} onValueChange={setCargo}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o cargo" />
              </SelectTrigger>
              <SelectContent className="max-h-60 z-[9999]">
                {cargos.map((c) => (
                  <SelectItem key={c.id} value={c.nome}>
                    {c.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {cargos.length === 0 && (
              <Input className="mt-1" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Gerente de Projeto" />
            )}
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Superior Direto</Label>
            <Select value={superiorId} onValueChange={setSuperiorId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Nenhum (raiz)" />
              </SelectTrigger>
              <SelectContent className="max-h-60 z-[9999]">
                <SelectItem value="none">Nenhum (raiz)</SelectItem>
                {possibleSuperiors.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.nome_colaborador ? `${n.nome_colaborador} — ${n.cargo}` : n.cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Quantidade de Posições</Label>
            <Input
              className="mt-1 w-24"
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Observação</Label>
            <Textarea
              className="mt-1"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação opcional..."
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!cargo.trim()}>
            {editingNode ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
