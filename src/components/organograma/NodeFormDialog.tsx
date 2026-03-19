import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OrganogramaNode } from "@/hooks/useOrganograma";

interface Colaborador {
  id: string;
  nome: string;
  cargo: string;
}

interface NodeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    cargo: string;
    nome_colaborador: string;
    superior_id: string | null;
    colaborador_id: string | null;
  }) => void;
  editingNode?: OrganogramaNode | null;
  existingNodes: OrganogramaNode[];
  colaboradores: Colaborador[];
}

export function NodeFormDialog({
  open,
  onOpenChange,
  onSave,
  editingNode,
  existingNodes,
  colaboradores,
}: NodeFormDialogProps) {
  const [cargo, setCargo] = useState("");
  const [nomeColaborador, setNomeColaborador] = useState("");
  const [superiorId, setSuperiorId] = useState<string>("none");
  const [colaboradorId, setColaboradorId] = useState<string>("manual");

  useEffect(() => {
    if (editingNode) {
      setCargo(editingNode.cargo);
      setNomeColaborador(editingNode.nome_colaborador);
      setSuperiorId(editingNode.superior_id || "none");
      setColaboradorId(editingNode.colaborador_id || "manual");
    } else {
      setCargo("");
      setNomeColaborador("");
      setSuperiorId("none");
      setColaboradorId("manual");
    }
  }, [editingNode, open]);

  const handleColaboradorChange = (val: string) => {
    setColaboradorId(val);
    if (val !== "manual") {
      const col = colaboradores.find((c) => c.id === val);
      if (col) {
        setNomeColaborador(col.nome);
        if (!cargo) setCargo(col.cargo);
      }
    }
  };

  const possibleSuperiors = existingNodes.filter((n) => !editingNode || n.id !== editingNode.id);

  const handleSubmit = () => {
    if (!cargo.trim() || !nomeColaborador.trim()) return;
    onSave({
      cargo: cargo.trim(),
      nome_colaborador: nomeColaborador.trim(),
      superior_id: superiorId === "none" ? null : superiorId,
      colaborador_id: colaboradorId === "manual" ? null : colaboradorId,
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
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Colaborador</Label>
            <Select value={colaboradorId} onValueChange={handleColaboradorChange}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione ou digite manualmente" />
              </SelectTrigger>
              <SelectContent className="max-h-60 z-[9999]">
                <SelectItem value="manual">Digitar manualmente</SelectItem>
                {colaboradores.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.nome} — {c.cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome do Colaborador</Label>
            <Input className="mt-1" value={nomeColaborador} onChange={(e) => setNomeColaborador(e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cargo / Função</Label>
            <Input className="mt-1" value={cargo} onChange={(e) => setCargo(e.target.value)} placeholder="Ex: Gerente de Projeto" />
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
                    {n.nome_colaborador} — {n.cargo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!cargo.trim() || !nomeColaborador.trim()}>
            {editingNode ? "Salvar" : "Adicionar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
