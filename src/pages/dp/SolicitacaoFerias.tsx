import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { CriadoPorInfo } from "@/components/CriadoPorInfo";

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

import { useCentrosCusto } from "@/hooks/useCadastros";

interface SolicitacaoFeriasRegistro {
  id: string;
  nomeColaborador: string;
  centroCusto: string;
  dataInicio: string;
  dataRetorno: string;
  qtdDias: number;
  observacoes: string;
  criadoPor?: string;
  criadoEm?: string;
}

const SolicitacaoFerias = () => {
  const { items: centrosCusto } = useCentrosCusto();
  const { profile } = useAuthContext();

  const [registros, setRegistros] = useState<SolicitacaoFeriasRegistro[]>(() => {
    try {
      const stored = localStorage.getItem("erp_solicitacao_ferias");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const save = (items: SolicitacaoFeriasRegistro[]) => {
    setRegistros(items);
    localStorage.setItem("erp_solicitacao_ferias", JSON.stringify(items));
  };

  const [form, setForm] = useState({
    nomeColaborador: "",
    centroCusto: "",
    dataInicio: "",
    dataRetorno: "",
    qtdDias: "",
    observacoes: "",
  });
  const [editId, setEditId] = useState<string | null>(null);

  const emptyMsg = "Nenhum registro encontrado. Cadastre primeiro em Gestão RH.";

  const resetForm = () => {
    setForm({ nomeColaborador: "", centroCusto: "", dataInicio: "", dataRetorno: "", qtdDias: "", observacoes: "" });
    setEditId(null);
  };

  const handleSave = () => {
    if (!form.nomeColaborador.trim() || !form.centroCusto || !form.dataInicio || !form.dataRetorno || !form.qtdDias) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (editId) {
      const updated = registros.map((r) =>
        r.id === editId ? { ...r, ...form, qtdDias: Number(form.qtdDias) } : r
      );
      save(updated);
      toast.success("Solicitação atualizada.");
    } else {
      const novo: SolicitacaoFeriasRegistro = {
        id: crypto.randomUUID(),
        ...form,
        qtdDias: Number(form.qtdDias),
      };
      save([...registros, novo]);
      toast.success("Solicitação de férias registrada.");
    }
    resetForm();
  };

  const handleEdit = (item: SolicitacaoFeriasRegistro) => {
    setEditId(item.id);
    setForm({
      nomeColaborador: item.nomeColaborador,
      centroCusto: item.centroCusto,
      dataInicio: item.dataInicio,
      dataRetorno: item.dataRetorno,
      qtdDias: String(item.qtdDias),
      observacoes: item.observacoes,
    });
  };

  const handleDelete = (id: string) => {
    save(registros.filter((r) => r.id !== id));
    toast.success("Solicitação excluída.");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Solicitação de Férias
      </h2>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="section-title">Nova Solicitação</h3>
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
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={form.dataInicio}
                onChange={(e) => setForm((p) => ({ ...p, dataInicio: e.target.value }))}
              />
            </div>

            <div>
              <Label>Data de Retorno *</Label>
              <Input
                type="date"
                value={form.dataRetorno}
                onChange={(e) => setForm((p) => ({ ...p, dataRetorno: e.target.value }))}
              />
            </div>

            <div>
              <Label>Quantidade de Dias *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 30"
                value={form.qtdDias}
                onChange={(e) => setForm((p) => ({ ...p, qtdDias: e.target.value }))}
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
            <h3 className="section-title">Solicitações Registradas</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Retorno</TableHead>
                  <TableHead>Dias</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.nomeColaborador}</TableCell>
                    <TableCell>{r.dataInicio}</TableCell>
                    <TableCell>{r.dataRetorno}</TableCell>
                    <TableCell>{r.qtdDias}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
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
    </div>
  );
};

export default SolicitacaoFerias;
