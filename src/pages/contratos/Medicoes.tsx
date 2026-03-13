import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useContratos } from "@/hooks/useContratos";
import { useMedicoes } from "@/hooks/useMedicoes";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyBRL, parseCurrencyBRL } from "@/utils/currency";

const emptyForm = {
  contrato_id: "",
  data_inicio: "",
  data_fim: "",
  descricao: "",
  valor_medido_display: "",
  observacao: "",
};

export default function Medicoes() {
  const { contratosQuery } = useContratos();
  const { medicoesQuery, createMedicao, updateMedicao, deleteMedicao } = useMedicoes();
  const contratos = contratosQuery.data ?? [];
  const medicoes = medicoesQuery.data ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const openEdit = (m: any) => {
    setEditingId(m.id);
    const centavos = Math.round(Number(m.valor_medido) * 100).toString();
    setForm({
      contrato_id: m.contrato_id,
      data_inicio: m.data_inicio,
      data_fim: m.data_fim,
      descricao: m.descricao,
      valor_medido_display: formatCurrencyBRL(centavos),
      observacao: m.observacao ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const valor = getValorNumber();
    if (!form.contrato_id || !form.data_inicio || !form.data_fim || !form.descricao || !valor) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      const payload = {
        contrato_id: form.contrato_id,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        descricao: form.descricao,
        valor_medido: valor,
        observacao: form.observacao || null,
      };
      if (editingId) {
        await updateMedicao.mutateAsync({ id: editingId, ...payload });
        toast.success("Medição atualizada com sucesso!");
      } else {
        await createMedicao.mutateAsync(payload);
        toast.success("Medição registrada com sucesso!");
      }
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    } catch {
      toast.error("Erro ao salvar medição.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir esta medição?")) return;
    try {
      await deleteMedicao.mutateAsync(id);
      toast.success("Medição excluída.");
    } catch {
      toast.error("Erro ao excluir medição.");
    }
  };

  const getContratoProjeto = (id: string) => contratos.find((c) => c.id === id)?.projeto_obra ?? "—";
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "";

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setForm({ ...form, valor_medido_display: raw ? formatCurrencyBRL(raw) : "" });
  };

  const handleValorPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) {
      setForm({ ...form, valor_medido_display: formatCurrencyBRL(pasted) });
    }
  };

  const getValorNumber = (): number => {
    const digits = parseCurrencyBRL(form.valor_medido_display);
    return digits ? parseInt(digits, 10) / 100 : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Medições</h1>
        <Button onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-2" />Nova Medição</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {medicoes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma medição registrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Período</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor Medido</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicoes.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{fmtDate(m.data_inicio)} — {fmtDate(m.data_fim)}</TableCell>
                    <TableCell className="font-medium">{getContratoProjeto(m.contrato_id)}</TableCell>
                    <TableCell>{m.descricao}</TableCell>
                    <TableCell>{fmt(Number(m.valor_medido))}</TableCell>
                    <TableCell className="text-muted-foreground">{m.observacao ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Medição" : "Nova Medição"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Data Fim *</Label>
                <Input type="date" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Contrato *</Label>
              <Select value={form.contrato_id} onValueChange={(v) => setForm({ ...form, contrato_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {contratos.filter((c) => c.status === "Ativo").map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.projeto_obra}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
            </div>
            <div>
              <Label>Valor Medido *</Label>
              <Input
                value={form.valor_medido_display}
                onChange={handleValorChange}
                onPaste={handleValorPaste}
                placeholder="R$ 0,00"
                inputMode="numeric"
              />
            </div>
            <div>
              <Label>Observação</Label>
              <Textarea value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createMedicao.isPending || updateMedicao.isPending}>
              {editingId ? "Salvar" : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
