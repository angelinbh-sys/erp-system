import { useState, useEffect, useRef } from "react";
import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { CriadoPorInfo } from "@/components/CriadoPorInfo";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { useCentrosCusto } from "@/hooks/useCadastros";

interface SolicitacaoFeriasRegistro {
  id: string;
  nome_colaborador: string;
  centro_custo: string;
  data_inicio: string;
  data_retorno: string;
  qtd_dias: number;
  observacoes: string;
  criado_por?: string | null;
  criado_em?: string | null;
}

let migrationAttempted = false;
async function migrateLocalStorageData() {
  if (migrationAttempted) return;
  migrationAttempted = true;
  try {
    const raw = localStorage.getItem("erp_solicitacao_ferias");
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      localStorage.removeItem("erp_solicitacao_ferias");
      return;
    }
    const { count, error: countErr } = await supabase
      .from("solicitacoes_ferias" as any)
      .select("*", { count: "exact", head: true });
    if (countErr) throw countErr;
    if ((count ?? 0) === 0) {
      const payload = items.map((r: any) => ({
        nome_colaborador: r.nomeColaborador ?? r.nome_colaborador ?? "",
        centro_custo: r.centroCusto ?? r.centro_custo ?? "",
        data_inicio: r.dataInicio ?? r.data_inicio,
        data_retorno: r.dataRetorno ?? r.data_retorno,
        qtd_dias: Number(r.qtdDias ?? r.qtd_dias ?? 0),
        observacoes: r.observacoes ?? "",
        criado_por: r.criadoPor ?? null,
        criado_em: r.criadoEm ?? null,
      }));
      const { error } = await supabase.from("solicitacoes_ferias" as any).insert(payload as any);
      if (!error) localStorage.removeItem("erp_solicitacao_ferias");
    } else {
      localStorage.removeItem("erp_solicitacao_ferias");
    }
  } catch (e) {
    console.error("Erro ao migrar solicitacoes_ferias:", e);
  }
}

const calcularDias = (inicio: string, retorno: string): number => {
  if (!inicio || !retorno) return 0;
  const di = new Date(inicio + "T00:00:00");
  const dr = new Date(retorno + "T00:00:00");
  const diff = Math.round((dr.getTime() - di.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return diff > 0 ? diff : 0;
};

const SolicitacaoFerias = () => {
  const { items: centrosCusto } = useCentrosCusto();
  const { profile } = useAuthContext();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const migrationRan = useRef(false);

  useEffect(() => {
    if (migrationRan.current) return;
    migrationRan.current = true;
    migrateLocalStorageData().then(() => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes_ferias"] });
    });
  }, [queryClient]);

  const { data: registros = [] } = useQuery<SolicitacaoFeriasRegistro[]>({
    queryKey: ["solicitacoes_ferias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_ferias" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["solicitacoes_ferias"] });

  const [form, setForm] = useState({
    nomeColaborador: "",
    centroCusto: "",
    dataInicio: "",
    dataRetorno: "",
    qtdDias: "",
    observacoes: "",
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-calc qtdDias when dates change
  useEffect(() => {
    if (form.dataInicio && form.dataRetorno) {
      const dias = calcularDias(form.dataInicio, form.dataRetorno);
      if (dias > 0) {
        setForm((p) => ({ ...p, qtdDias: String(dias) }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.dataInicio, form.dataRetorno]);

  const emptyMsg = "Nenhum registro encontrado. Cadastre primeiro em Gestão RH.";

  const resetForm = () => {
    setForm({ nomeColaborador: "", centroCusto: "", dataInicio: "", dataRetorno: "", qtdDias: "", observacoes: "" });
    setEditId(null);
  };

  const handleSave = async () => {
    if (!form.nomeColaborador.trim() || !form.centroCusto || !form.dataInicio || !form.dataRetorno || !form.qtdDias) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (new Date(form.dataRetorno) <= new Date(form.dataInicio)) {
      toast.error("A data de retorno deve ser posterior à data de início.");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        const { error } = await supabase.from("solicitacoes_ferias" as any).update({
          nome_colaborador: form.nomeColaborador,
          centro_custo: form.centroCusto,
          data_inicio: form.dataInicio,
          data_retorno: form.dataRetorno,
          qtd_dias: Number(form.qtdDias),
          observacoes: form.observacoes,
        }).eq("id", editId);
        if (error) throw error;
        await logAction({
          modulo: "Dep. Pessoal", pagina: "Solicitação de Férias", acao: "edicao",
          descricao: `Editou solicitação de férias: ${form.nomeColaborador}`,
          registro_id: editId, registro_ref: form.nomeColaborador,
        });
        toast.success("Solicitação atualizada.");
      } else {
        const { data: inserted, error } = await supabase.from("solicitacoes_ferias" as any).insert({
          nome_colaborador: form.nomeColaborador,
          centro_custo: form.centroCusto,
          data_inicio: form.dataInicio,
          data_retorno: form.dataRetorno,
          qtd_dias: Number(form.qtdDias),
          observacoes: form.observacoes,
          criado_por: profile?.nome || "Sistema",
          criado_em: new Date().toISOString(),
        }).select("id").single();
        if (error) throw error;
        await logAction({
          modulo: "Dep. Pessoal", pagina: "Solicitação de Férias", acao: "criacao",
          descricao: `Criou solicitação de férias: ${form.nomeColaborador}`,
          registro_id: (inserted as any)?.id, registro_ref: form.nomeColaborador,
        });
        toast.success("Solicitação de férias registrada.");
      }
      invalidate();
      resetForm();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar solicitação.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: SolicitacaoFeriasRegistro) => {
    setEditId(item.id);
    setForm({
      nomeColaborador: item.nome_colaborador,
      centroCusto: item.centro_custo,
      dataInicio: item.data_inicio,
      dataRetorno: item.data_retorno,
      qtdDias: String(item.qtd_dias),
      observacoes: item.observacoes,
    });
  };

  const handleDelete = async (id: string) => {
    const item = registros.find(r => r.id === id);
    const { error } = await supabase.from("solicitacoes_ferias" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir solicitação."); return; }
    await logAction({
      modulo: "Dep. Pessoal", pagina: "Solicitação de Férias", acao: "exclusao",
      descricao: `Excluiu solicitação de férias: ${item?.nome_colaborador || "—"}`,
      registro_id: id, registro_ref: item?.nome_colaborador,
    });
    toast.success("Solicitação excluída.");
    invalidate();
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
            <Button onClick={handleSave} size="sm" disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              {saving ? "Salvando..." : editId ? "Atualizar" : "Registrar"}
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
                    <TableCell>
                      <div>
                        {r.nome_colaborador}
                        <CriadoPorInfo criadoPorNome={r.criado_por ?? undefined} criadoEm={r.criado_em ?? undefined} className="mt-1" />
                      </div>
                    </TableCell>
                    <TableCell>{r.data_inicio}</TableCell>
                    <TableCell>{r.data_retorno}</TableCell>
                    <TableCell>{r.qtd_dias}</TableCell>
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
