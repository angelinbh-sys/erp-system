import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
} from "@/components/ui/dialog";

import { useCargos, useCentrosCusto } from "@/hooks/useCadastros";
import { useColaboradores } from "@/hooks/useColaboradores";

interface AlteracaoRegistro {
  id: string;
  nomeColaborador: string;
  cargoAtual: string;
  novoCargo: string;
  centroCusto: string;
  dataAlteracao: string;
  observacoes: string;
  anexo?: string;
}

const AlteracaoFuncao = () => {
  const { items: cargos } = useCargos();
  const { items: centrosCusto } = useCentrosCusto();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [registros, setRegistros] = useState<AlteracaoRegistro[]>(() => {
    try {
      const stored = localStorage.getItem("erp_alteracoes_funcao");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const save = (items: AlteracaoRegistro[]) => {
    setRegistros(items);
    localStorage.setItem("erp_alteracoes_funcao", JSON.stringify(items));
  };

  const [form, setForm] = useState({
    nomeColaborador: "",
    cargoAtual: "",
    novoCargo: "",
    centroCusto: "",
    dataAlteracao: "",
    observacoes: "",
  });
  const [anexo, setAnexo] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<AlteracaoRegistro | null>(null);

  const emptyMsg = "Nenhum registro encontrado. Cadastre primeiro em Gestão RH.";

  const resetForm = () => {
    setForm({ nomeColaborador: "", cargoAtual: "", novoCargo: "", centroCusto: "", dataAlteracao: "", observacoes: "" });
    setAnexo(null);
    setEditId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    if (!form.nomeColaborador.trim() || !form.cargoAtual || !form.novoCargo || !form.centroCusto || !form.dataAlteracao) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (editId) {
      const updated = registros.map((r) =>
        r.id === editId ? { ...r, ...form, anexo: anexo?.name || r.anexo } : r
      );
      save(updated);
      toast.success("Registro atualizado.");
    } else {
      const novo: AlteracaoRegistro = {
        id: crypto.randomUUID(),
        ...form,
        anexo: anexo?.name,
      };
      save([...registros, novo]);
      toast.success("Alteração de função registrada.");
    }
    resetForm();
  };

  const handleEdit = (item: AlteracaoRegistro) => {
    setEditId(item.id);
    setForm({
      nomeColaborador: item.nomeColaborador,
      cargoAtual: item.cargoAtual,
      novoCargo: item.novoCargo,
      centroCusto: item.centroCusto,
      dataAlteracao: item.dataAlteracao,
      observacoes: item.observacoes,
    });
  };

  const handleDelete = (id: string) => {
    save(registros.filter((r) => r.id !== id));
    toast.success("Registro excluído.");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Alteração de Função / Cargo
      </h2>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="section-title">Novo Registro</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Nome do Colaborador *</Label>
              <Input
                placeholder="Nome completo"
                value={form.nomeColaborador}
                onChange={(e) => setForm((p) => ({ ...p, nomeColaborador: e.target.value }))}
              />
            </div>

            <div>
              <Label>Cargo Atual *</Label>
              <Select value={form.cargoAtual} onValueChange={(v) => setForm((p) => ({ ...p, cargoAtual: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {cargos.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">{emptyMsg}</div>
                  ) : cargos.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Novo Cargo *</Label>
              <Select value={form.novoCargo} onValueChange={(v) => setForm((p) => ({ ...p, novoCargo: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {cargos.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">{emptyMsg}</div>
                  ) : cargos.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Centro de Custo *</Label>
              <Select value={form.centroCusto} onValueChange={(v) => setForm((p) => ({ ...p, centroCusto: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {centrosCusto.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">{emptyMsg}</div>
                  ) : centrosCusto.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.codigo ? `${c.codigo} - ${c.nome}` : c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data da Alteração *</Label>
              <Input
                type="date"
                value={form.dataAlteracao}
                onChange={(e) => setForm((p) => ({ ...p, dataAlteracao: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações (opcional)"
                value={form.observacoes}
                onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Anexo (opcional)</Label>
              <div
                className="border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.png"
                  className="hidden"
                  onChange={(e) => setAnexo(e.target.files?.[0] || null)}
                />
                {anexo ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-medium text-foreground">{anexo.name}</span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setAnexo(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-sm">Clique para anexar documento</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {editId ? "Atualizar" : "Registrar"}
            </Button>
            {editId && (
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {registros.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="section-title">Histórico de Alterações</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Cargo Atual</TableHead>
                  <TableHead>Novo Cargo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.nomeColaborador}</TableCell>
                    <TableCell>{r.cargoAtual}</TableCell>
                    <TableCell>{r.novoCargo}</TableCell>
                    <TableCell>{r.dataAlteracao}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setViewItem(r)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Alteração</DialogTitle>
          </DialogHeader>
          {viewItem && (
            <div className="space-y-2 text-sm">
              <p><strong>Colaborador:</strong> {viewItem.nomeColaborador}</p>
              <p><strong>Cargo Atual:</strong> {viewItem.cargoAtual}</p>
              <p><strong>Novo Cargo:</strong> {viewItem.novoCargo}</p>
              <p><strong>Centro de Custo:</strong> {viewItem.centroCusto}</p>
              <p><strong>Data:</strong> {viewItem.dataAlteracao}</p>
              <p><strong>Observações:</strong> {viewItem.observacoes || "—"}</p>
              <p><strong>Anexo:</strong> {viewItem.anexo || "Nenhum"}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlteracaoFuncao;
