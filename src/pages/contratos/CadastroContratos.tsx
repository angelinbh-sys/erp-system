import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useContratos, type Contrato } from "@/hooks/useContratos";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyBRL, parseCurrencyBRL } from "@/utils/currency";

const emptyForm = {
  numero_contrato: "",
  cliente: "",
  projeto_obra: "",
  valor_contrato_display: "",
  data_inicio: "",
  data_termino: "",
  responsavel: "",
  status: "Ativo",
};

export default function CadastroContratos() {
  const { contratosQuery, createContrato, updateContrato, deleteContrato } = useContratos();
  const contratos = contratosQuery.data ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [dataError, setDataError] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (c: Contrato) => {
    setEditingId(c.id);
    const centavos = Math.round(Number(c.valor_contrato) * 100).toString();
    setForm({
      numero_contrato: c.numero_contrato,
      cliente: c.cliente,
      projeto_obra: c.projeto_obra,
      valor_contrato_display: formatCurrencyBRL(centavos),
      data_inicio: c.data_inicio,
      data_termino: c.data_termino,
      responsavel: c.responsavel,
      status: c.status,
    });
    setDialogOpen(true);
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setForm({ ...form, valor_contrato_display: raw ? formatCurrencyBRL(raw) : "" });
  };

  const handleValorPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted) {
      setForm({ ...form, valor_contrato_display: formatCurrencyBRL(pasted) });
    }
  };

  const getValorNumber = (): number => {
    const digits = parseCurrencyBRL(form.valor_contrato_display);
    return digits ? parseInt(digits, 10) / 100 : 0;
  };

  const handleSave = async () => {
    const valor = getValorNumber();
    if (!form.numero_contrato || !form.cliente || !form.projeto_obra || !form.data_inicio || !form.data_termino || !form.responsavel) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      const payload = {
        numero_contrato: form.numero_contrato,
        cliente: form.cliente,
        projeto_obra: form.projeto_obra,
        valor_contrato: valor,
        data_inicio: form.data_inicio,
        data_termino: form.data_termino,
        responsavel: form.responsavel,
        status: form.status,
      };
      if (editingId) {
        await updateContrato.mutateAsync({ id: editingId, ...payload });
        toast.success("Contrato atualizado com sucesso!");
      } else {
        await createContrato.mutateAsync(payload);
        toast.success("Contrato cadastrado com sucesso!");
      }
      setDialogOpen(false);
    } catch {
      toast.error("Erro ao salvar contrato.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este contrato? Todas as medições associadas também serão excluídas.")) return;
    try {
      await deleteContrato.mutateAsync(id);
      toast.success("Contrato excluído.");
    } catch {
      toast.error("Erro ao excluir contrato.");
    }
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">Cadastro de Contratos</h1>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />Novo Contrato</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {contratos.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhum contrato cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Projeto / Obra</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Término</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contratos.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.numero_contrato}</TableCell>
                    <TableCell>{c.cliente}</TableCell>
                    <TableCell>{c.projeto_obra}</TableCell>
                    <TableCell>{fmt(Number(c.valor_contrato))}</TableCell>
                    <TableCell>{fmtDate(c.data_inicio)}</TableCell>
                    <TableCell>{fmtDate(c.data_termino)}</TableCell>
                    <TableCell>{c.responsavel}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${c.status === "Ativo" ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>
                        {c.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editingId ? "Editar Contrato" : "Novo Contrato"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número do Contrato *</Label>
                <Input value={form.numero_contrato} onChange={(e) => setForm({ ...form, numero_contrato: e.target.value })} />
              </div>
              <div>
                <Label>Cliente *</Label>
                <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Projeto / Obra *</Label>
              <Input value={form.projeto_obra} onChange={(e) => setForm({ ...form, projeto_obra: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor do Contrato *</Label>
                <Input
                  value={form.valor_contrato_display}
                  onChange={handleValorChange}
                  onPaste={handleValorPaste}
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                />
              </div>
              <div>
                <Label>Responsável *</Label>
                <Input value={form.responsavel} onChange={(e) => setForm({ ...form, responsavel: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data de Início *</Label>
                <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
              </div>
              <div>
                <Label>Data de Término *</Label>
                <Input type="date" value={form.data_termino} onChange={(e) => setForm({ ...form, data_termino: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createContrato.isPending || updateContrato.isPending}>
              {editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
