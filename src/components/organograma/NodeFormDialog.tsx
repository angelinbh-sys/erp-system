import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [searchColab, setSearchColab] = useState("");

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
    setSearchColab("");
  }, [editingNode, open]);

  const filteredColaboradores = useMemo(() => {
    if (!searchColab.trim()) return colaboradores;
    const term = searchColab.toLowerCase();
    return colaboradores.filter(
      (c) => c.nome.toLowerCase().includes(term) || c.cargo.toLowerCase().includes(term)
    );
  }, [colaboradores, searchColab]);

  const handleColaboradorSelect = (col: Colaborador) => {
    setColaboradorId(col.id);
    setNomeColaborador(col.nome);
    if (!cargo) setCargo(col.cargo);
    setSearchColab("");
  };

  const handleManual = () => {
    setColaboradorId("manual");
    setSearchColab("");
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

  const selectedColabName = colaboradorId !== "manual"
    ? colaboradores.find((c) => c.id === colaboradorId)?.nome
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingNode ? "Editar Posição" : "Adicionar Posição"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Colaborador search */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Colaborador</Label>
            <div className="mt-1 space-y-2">
              <Input
                placeholder="Buscar colaborador pelo nome..."
                value={searchColab}
                onChange={(e) => setSearchColab(e.target.value)}
                className="h-8 text-sm"
              />
              {selectedColabName && !searchColab && (
                <div className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-3 py-1.5">
                  <span className="font-medium text-foreground">{selectedColabName}</span>
                  <Button variant="ghost" size="sm" className="h-5 px-1 text-xs ml-auto" onClick={handleManual}>
                    Limpar
                  </Button>
                </div>
              )}
              {searchColab.trim() && (
                <ScrollArea className="max-h-40 border rounded-md">
                  <div className="p-1">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors text-muted-foreground italic"
                      onClick={handleManual}
                    >
                      Digitar manualmente
                    </button>
                    {filteredColaboradores.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-muted-foreground">Nenhum colaborador encontrado.</div>
                    ) : (
                      filteredColaboradores.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-muted transition-colors"
                          onClick={() => handleColaboradorSelect(c)}
                        >
                          {c.nome} — <span className="text-muted-foreground">{c.cargo}</span>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}
              {!searchColab.trim() && !selectedColabName && (
                <p className="text-xs text-muted-foreground">Digite para buscar ou preencha manualmente abaixo.</p>
              )}
            </div>
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
