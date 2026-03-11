import { useState } from "react";
import { Pencil, History } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useColaboradores,
  useColaboradorHistorico,
  useUpdateColaborador,
  type Colaborador,
} from "@/hooks/useColaboradores";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";

const Efetivo = () => {
  const { profile } = useAuthContext();
  const { data: colaboradores = [], isLoading } = useColaboradores();
  const updateColaborador = useUpdateColaborador();

  const [editColaborador, setEditColaborador] = useState<Colaborador | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", cargo: "", centro_custo: "", site_contrato: "", status: "" });
  const [motivo, setMotivo] = useState("");
  const [histColaboradorId, setHistColaboradorId] = useState<string | null>(null);
  const { data: historico = [] } = useColaboradorHistorico(histColaboradorId);

  const openEdit = (c: Colaborador) => {
    setEditColaborador(c);
    setEditForm({
      nome: c.nome,
      cargo: c.cargo,
      centro_custo: c.centro_custo,
      site_contrato: c.site_contrato,
      status: c.status,
    });
    setMotivo("");
  };

  const handleSaveEdit = async () => {
    if (!editColaborador || !motivo.trim()) {
      toast.error("O motivo da alteração é obrigatório.");
      return;
    }

    const changes: Array<{
      colaborador_id: string;
      campo_alterado: string;
      valor_anterior: string | null;
      valor_novo: string | null;
      motivo: string;
      alterado_por: string;
    }> = [];
    const updates: Record<string, unknown> = {};
    const alteradoPor = profile?.nome || "Sistema";

    const fields = [
      { key: "nome", label: "Nome" },
      { key: "cargo", label: "Cargo" },
      { key: "centro_custo", label: "Centro de Custo" },
      { key: "site_contrato", label: "Site / Contrato" },
      { key: "status", label: "Status" },
    ] as const;

    for (const f of fields) {
      const oldVal = editColaborador[f.key];
      const newVal = editForm[f.key];
      if (oldVal !== newVal) {
        updates[f.key] = newVal;
        changes.push({
          colaborador_id: editColaborador.id,
          campo_alterado: f.label,
          valor_anterior: oldVal,
          valor_novo: newVal,
          motivo: motivo.trim(),
          alterado_por: alteradoPor,
        });
      }
    }

    if (Object.keys(updates).length === 0) {
      toast.info("Nenhuma alteração detectada.");
      return;
    }

    try {
      await updateColaborador.mutateAsync({
        id: editColaborador.id,
        updates,
        historico: changes,
      });
      toast.success("Dados atualizados com sucesso.");
      setEditColaborador(null);
    } catch {
      toast.error("Erro ao atualizar dados.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Efetivo
      </h2>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : colaboradores.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhum colaborador no efetivo.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead>Data de Admissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradores.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.cargo}</TableCell>
                    <TableCell>{c.centro_custo}</TableCell>
                    <TableCell>{c.site_contrato}</TableCell>
                    <TableCell>{new Date(c.data_admissao).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "Ativo" ? "default" : "secondary"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Histórico" onClick={() => setHistColaboradorId(c.id)}>
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editColaborador} onOpenChange={() => setEditColaborador(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Dados do Colaborador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={editForm.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Cargo / Função</Label>
              <Input value={editForm.cargo} onChange={(e) => setEditForm((p) => ({ ...p, cargo: e.target.value }))} />
            </div>
            <div>
              <Label>Centro de Custo</Label>
              <Input value={editForm.centro_custo} onChange={(e) => setEditForm((p) => ({ ...p, centro_custo: e.target.value }))} />
            </div>
            <div>
              <Label>Site / Contrato</Label>
              <Input value={editForm.site_contrato} onChange={(e) => setEditForm((p) => ({ ...p, site_contrato: e.target.value }))} />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Motivo da Alteração *</Label>
              <Textarea
                placeholder="Descreva o motivo da alteração"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditColaborador(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateColaborador.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!histColaboradorId} onOpenChange={() => setHistColaboradorId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Alterações</DialogTitle>
          </DialogHeader>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma alteração registrada.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-auto">
              {historico.map((h) => (
                <div key={h.id} className="border border-border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{h.campo_alterado}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(h.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-muted-foreground">
                    <span className="line-through">{h.valor_anterior || "—"}</span> → {h.valor_novo || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Motivo: {h.motivo}</p>
                  <p className="text-xs text-muted-foreground">Por: {h.alterado_por}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Efetivo;
