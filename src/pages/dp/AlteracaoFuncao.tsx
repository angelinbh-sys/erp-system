import { useState, useRef, useEffect } from "react";
import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2, Eye, Upload, X, Download } from "lucide-react";
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import { useCargos, useCentrosCusto } from "@/hooks/useCadastros";
import { useColaboradores } from "@/hooks/useColaboradores";

interface AlteracaoRegistro {
  id: string;
  nome_colaborador: string;
  cargo_atual: string;
  novo_cargo: string;
  centro_custo: string;
  data_alteracao: string;
  observacoes: string;
  anexo_nome?: string | null;
  anexo_path?: string | null;
  criado_por?: string | null;
  criado_em?: string | null;
}

// One-time migration from localStorage to Supabase
let migrationAttempted = false;
async function migrateLocalStorageData() {
  if (migrationAttempted) return;
  migrationAttempted = true;
  try {
    const raw = localStorage.getItem("erp_alteracoes_funcao");
    if (!raw) return;
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      localStorage.removeItem("erp_alteracoes_funcao");
      return;
    }
    const { count, error: countErr } = await supabase
      .from("alteracoes_funcao" as any)
      .select("*", { count: "exact", head: true });
    if (countErr) throw countErr;
    if ((count ?? 0) === 0) {
      const payload = items.map((r: any) => ({
        nome_colaborador: r.nomeColaborador ?? r.nome_colaborador ?? "",
        cargo_atual: r.cargoAtual ?? r.cargo_atual ?? "",
        novo_cargo: r.novoCargo ?? r.novo_cargo ?? "",
        centro_custo: r.centroCusto ?? r.centro_custo ?? "",
        data_alteracao: r.dataAlteracao ?? r.data_alteracao ?? new Date().toISOString().slice(0, 10),
        observacoes: r.observacoes ?? "",
        anexo_nome: r.anexo ?? null,
        criado_por: r.criadoPor ?? null,
        criado_em: r.criadoEm ?? null,
      }));
      const { error } = await supabase.from("alteracoes_funcao" as any).insert(payload as any);
      if (!error) localStorage.removeItem("erp_alteracoes_funcao");
    } else {
      localStorage.removeItem("erp_alteracoes_funcao");
    }
  } catch (e) {
    console.error("Erro ao migrar alteracoes_funcao:", e);
  }
}

const AlteracaoFuncao = () => {
  const { items: cargos } = useCargos();
  const { items: centrosCusto } = useCentrosCusto();
  const { data: colaboradores = [] } = useColaboradores();
  const { profile } = useAuthContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const migrationRan = useRef(false);

  useEffect(() => {
    if (migrationRan.current) return;
    migrationRan.current = true;
    migrateLocalStorageData().then(() => {
      queryClient.invalidateQueries({ queryKey: ["alteracoes_funcao"] });
    });
  }, [queryClient]);

  const { data: registros = [] } = useQuery<AlteracaoRegistro[]>({
    queryKey: ["alteracoes_funcao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alteracoes_funcao" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["alteracoes_funcao"] });

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
  const [saving, setSaving] = useState(false);

  const emptyMsg = "Nenhum registro encontrado. Cadastre primeiro em Gestão RH.";

  const resetForm = () => {
    setForm({ nomeColaborador: "", cargoAtual: "", novoCargo: "", centroCusto: "", dataAlteracao: "", observacoes: "" });
    setAnexo(null);
    setEditId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const sanitize = (n: string) => n.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploadAnexo = async (file: File): Promise<{ path: string; nome: string } | null> => {
    const path = `alteracoes-funcao/${Date.now()}_${sanitize(file.name)}`;
    const { error } = await supabase.storage.from("dp-arquivos").upload(path, file);
    if (error) {
      console.error("Erro upload anexo:", error);
      toast.error("Erro ao enviar o anexo.");
      return null;
    }
    return { path, nome: file.name };
  };

  const handleSave = async () => {
    if (!form.nomeColaborador.trim() || !form.cargoAtual || !form.novoCargo || !form.centroCusto || !form.dataAlteracao) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (form.cargoAtual === form.novoCargo) {
      toast.error("O novo cargo deve ser diferente do cargo atual.");
      return;
    }

    setSaving(true);
    try {
      let anexoData: { path: string; nome: string } | null = null;
      if (anexo) {
        anexoData = await uploadAnexo(anexo);
        if (!anexoData) { setSaving(false); return; }
      }

      if (editId) {
        const updates: any = {
          nome_colaborador: form.nomeColaborador,
          cargo_atual: form.cargoAtual,
          novo_cargo: form.novoCargo,
          centro_custo: form.centroCusto,
          data_alteracao: form.dataAlteracao,
          observacoes: form.observacoes,
        };
        if (anexoData) {
          updates.anexo_path = anexoData.path;
          updates.anexo_nome = anexoData.nome;
        }
        const { error } = await supabase.from("alteracoes_funcao" as any).update(updates).eq("id", editId);
        if (error) throw error;
        await logAction({
          modulo: "Dep. Pessoal", pagina: "Alteração de Função / Cargo", acao: "edicao",
          descricao: `Editou alteração de função: ${form.nomeColaborador} (${form.cargoAtual} → ${form.novoCargo})`,
          registro_id: editId, registro_ref: form.nomeColaborador,
        });
        toast.success("Registro atualizado.");
      } else {
        const insert: any = {
          nome_colaborador: form.nomeColaborador,
          cargo_atual: form.cargoAtual,
          novo_cargo: form.novoCargo,
          centro_custo: form.centroCusto,
          data_alteracao: form.dataAlteracao,
          observacoes: form.observacoes,
          anexo_path: anexoData?.path ?? null,
          anexo_nome: anexoData?.nome ?? null,
          criado_por: profile?.nome || "Sistema",
          criado_em: new Date().toISOString(),
        };
        const { data: inserted, error } = await supabase.from("alteracoes_funcao" as any).insert(insert).select("id").single();
        if (error) throw error;
        await logAction({
          modulo: "Dep. Pessoal", pagina: "Alteração de Função / Cargo", acao: "criacao",
          descricao: `Registrou alteração de função: ${form.nomeColaborador} (${form.cargoAtual} → ${form.novoCargo})`,
          registro_id: (inserted as any)?.id, registro_ref: form.nomeColaborador,
        });
        toast.success("Alteração de função registrada.");
      }
      invalidate();
      resetForm();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar registro.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: AlteracaoRegistro) => {
    setEditId(item.id);
    setForm({
      nomeColaborador: item.nome_colaborador,
      cargoAtual: item.cargo_atual,
      novoCargo: item.novo_cargo,
      centroCusto: item.centro_custo,
      dataAlteracao: item.data_alteracao,
      observacoes: item.observacoes,
    });
  };

  const handleDelete = async (id: string) => {
    const item = registros.find(r => r.id === id);
    const { error } = await supabase.from("alteracoes_funcao" as any).delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir registro."); return; }
    await logAction({
      modulo: "Dep. Pessoal", pagina: "Alteração de Função / Cargo", acao: "exclusao",
      descricao: `Excluiu alteração de função: ${item?.nome_colaborador || "—"}`,
      registro_id: id, registro_ref: item?.nome_colaborador,
    });
    toast.success("Registro excluído.");
    invalidate();
  };

  const handleDownload = async (item: AlteracaoRegistro) => {
    if (!item.anexo_path) return;
    const { data, error } = await supabase.storage.from("dp-arquivos").createSignedUrl(item.anexo_path, 60);
    if (error || !data?.signedUrl) { toast.error("Erro ao gerar link do anexo."); return; }
    window.open(data.signedUrl, "_blank");
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
              <Select value={form.nomeColaborador} onValueChange={(v) => {
                const col = colaboradores.find(c => c.nome === v);
                setForm((p) => ({ ...p, nomeColaborador: v, cargoAtual: col?.cargo || p.cargoAtual }));
              }}>
                <SelectTrigger><SelectValue placeholder="Selecione o colaborador" /></SelectTrigger>
                <SelectContent>
                  {colaboradores.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">Nenhum colaborador cadastrado.</div>
                  ) : colaboradores.map((c) => (
                    <SelectItem key={c.id} value={c.nome}>{c.nome} — {c.cargo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <TableCell>{r.nome_colaborador}</TableCell>
                    <TableCell>{r.cargo_atual}</TableCell>
                    <TableCell>{r.novo_cargo}</TableCell>
                    <TableCell>{r.data_alteracao}</TableCell>
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
              <p><strong>Colaborador:</strong> {viewItem.nome_colaborador}</p>
              <p><strong>Cargo Atual:</strong> {viewItem.cargo_atual}</p>
              <p><strong>Novo Cargo:</strong> {viewItem.novo_cargo}</p>
              <p><strong>Centro de Custo:</strong> {viewItem.centro_custo}</p>
              <p><strong>Data:</strong> {viewItem.data_alteracao}</p>
              <p><strong>Observações:</strong> {viewItem.observacoes || "—"}</p>
              <div className="flex items-center gap-2">
                <strong>Anexo:</strong>
                {viewItem.anexo_path ? (
                  <Button variant="outline" size="sm" onClick={() => handleDownload(viewItem)}>
                    <Download className="h-4 w-4 mr-1" />
                    {viewItem.anexo_nome || "Baixar anexo"}
                  </Button>
                ) : (
                  <span>{viewItem.anexo_nome || "Nenhum"}</span>
                )}
              </div>
              <CriadoPorInfo criadoPorNome={viewItem.criado_por ?? undefined} criadoEm={viewItem.criado_em ?? undefined} className="mt-3 pt-3 border-t border-border" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AlteracaoFuncao;
