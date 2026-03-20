import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, History, User as UserIcon, Upload, Download, FileDown, Plus, Trash2 } from "lucide-react";
import { toast } from "@/lib/toast";
import { capitalizeName } from "@/utils/formatName";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useQueryClient } from "@tanstack/react-query";
import {
  useColaboradores, useColaboradorHistorico, useUpdateColaborador, type Colaborador,
} from "@/hooks/useColaboradores";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { formatFirstLastName } from "@/utils/formatName";
import { supabase } from "@/integrations/supabase/client";
import { downloadModelo, exportColaboradores } from "@/utils/colaboradorExcel";
import ImportColaboradoresDialog from "@/components/ImportColaboradoresDialog";
import { useCentrosCusto, useCargos } from "@/hooks/useCadastros";
import { useContratos } from "@/hooks/useContratos";

function useColaboradorFotos(colaboradores: Colaborador[]) {
  const [fotos, setFotos] = useState<Record<string, string>>({});

  useEffect(() => {
    const vagaIds = colaboradores.filter(c => c.vaga_id).map(c => c.vaga_id!);
    if (vagaIds.length === 0) return;

    const fetchFotos = async () => {
      const { data } = await supabase
        .from("admissao_documentos")
        .select("vaga_id, arquivo_path")
        .in("vaga_id", vagaIds)
        .eq("tipo_documento", "foto_3x4")
        .eq("status", "anexado");

      if (!data || data.length === 0) return;

      const fotoMap: Record<string, string> = {};
      for (const doc of data) {
        if (doc.arquivo_path) {
          const { data: urlData } = await supabase.storage
            .from("admissao-documentos")
            .createSignedUrl(doc.arquivo_path, 3600);
          if (urlData?.signedUrl) {
            fotoMap[doc.vaga_id] = urlData.signedUrl;
          }
        }
      }
      setFotos(fotoMap);
    };

    fetchFotos();
  }, [colaboradores]);

  return fotos;
}

const Efetivo = () => {
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const { data: colaboradores = [], isLoading } = useColaboradores();
  const updateColaborador = useUpdateColaborador();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const fotos = useColaboradorFotos(colaboradores);

  const isMaster = profile?.super_admin || profile?.grupo_permissao === "Master";

  const [filterNome, setFilterNome] = useState("");
  const [filterCargo, setFilterCargo] = useState("");
  const [filterCentroCusto, setFilterCentroCusto] = useState("");
  const [filterSite, setFilterSite] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filteredColaboradores = colaboradores.filter((c) => {
    if (filterNome && !c.nome.toLowerCase().includes(filterNome.toLowerCase())) return false;
    if (filterCargo && !c.cargo.toLowerCase().includes(filterCargo.toLowerCase())) return false;
    if (filterCentroCusto && !c.centro_custo.toLowerCase().includes(filterCentroCusto.toLowerCase())) return false;
    if (filterSite && !c.site_contrato.toLowerCase().includes(filterSite.toLowerCase())) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    return true;
  });

  const [showImport, setShowImport] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newForm, setNewForm] = useState({
    nome: "", cpf: "", data_nascimento: "", sexo: "", telefone: "",
    cargo: "", centro_custo: "", contrato: "", site_contrato: "",
    data_admissao: "", status: "Ativo",
  });
  const [savingNew, setSavingNew] = useState(false);

  const [editColaborador, setEditColaborador] = useState<Colaborador | null>(null);
  const [editForm, setEditForm] = useState({ nome: "", cargo: "", centro_custo: "", site_contrato: "", status: "" });
  const [motivo, setMotivo] = useState("");
  const [histColaboradorId, setHistColaboradorId] = useState<string | null>(null);
  const { data: historico = [] } = useColaboradorHistorico(histColaboradorId);

  // Delete state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"single" | "mass">("mass");
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredColaboradores.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredColaboradores.map((c) => c.id)));
    }
  };

  const handleDeleteSingle = (id: string) => {
    setSingleDeleteId(id);
    setDeleteTarget("single");
    setDeleteConfirmOpen(true);
  };

  const handleDeleteMass = () => {
    setDeleteTarget("mass");
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const ids = deleteTarget === "single" && singleDeleteId ? [singleDeleteId] : Array.from(selectedIds);
      const nomes = ids.map((id) => colaboradores.find((c) => c.id === id)?.nome || id);

      const { error } = await supabase.from("colaboradores").delete().in("id", ids);
      if (error) throw error;

      await logAction({
        modulo: "Dep. Pessoal", pagina: "Efetivo", acao: "exclusao",
        descricao: `Excluiu ${ids.length} colaborador(es): ${nomes.map(n => formatFirstLastName(n)).join(", ")}.`,
      });

      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success(`${ids.length} colaborador(es) excluído(s) com sucesso.`);
      setSelectedIds(new Set());
      setSingleDeleteId(null);
    } catch {
      toast.error("Erro ao excluir colaborador(es).");
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  const openEdit = (c: Colaborador) => {
    setEditColaborador(c);
    setEditForm({ nome: c.nome, cargo: c.cargo, centro_custo: c.centro_custo, site_contrato: c.site_contrato, status: c.status });
    setMotivo("");
  };

  const handleSaveEdit = async () => {
    if (!editColaborador || !motivo.trim()) {
      toast.error("O motivo da alteração é obrigatório.");
      return;
    }

    const changes: Array<{ colaborador_id: string; campo_alterado: string; valor_anterior: string | null; valor_novo: string | null; motivo: string; alterado_por: string }> = [];
    const updates: Record<string, unknown> = {};
    const alteradoPor = formatFirstLastName(profile?.nome) || "Sistema";

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
          colaborador_id: editColaborador.id, campo_alterado: f.label,
          valor_anterior: oldVal, valor_novo: newVal, motivo: motivo.trim(), alterado_por: alteradoPor,
        });
      }
    }

    if (Object.keys(updates).length === 0) { toast.info("Nenhuma alteração detectada."); return; }

    try {
      await updateColaborador.mutateAsync({ id: editColaborador.id, updates, historico: changes });
      await logAction({
        modulo: "Dep. Pessoal", pagina: "Efetivo", acao: "edicao",
        descricao: `Editou colaborador ${editColaborador.nome}: ${changes.map(c => c.campo_alterado).join(", ")}`,
        registro_id: editColaborador.id, registro_ref: editColaborador.nome, motivo: motivo.trim(),
      });
      toast.success("Dados atualizados com sucesso.");
      setEditColaborador(null);
    } catch { toast.error("Erro ao atualizar dados."); }
  };

  const handleAddNew = async () => {
    if (!newForm.nome.trim() || !newForm.cargo.trim() || !newForm.centro_custo.trim() || !newForm.site_contrato.trim()) {
      toast.error("Preencha os campos obrigatórios: Nome, Cargo, Centro de Custo e Site.");
      return;
    }
    setSavingNew(true);
    try {
      const record = {
        nome: capitalizeName(newForm.nome.trim()),
        cpf: newForm.cpf.trim() || null,
        data_nascimento: newForm.data_nascimento || null,
        sexo: newForm.sexo || null,
        telefone: newForm.telefone.trim() || null,
        cargo: capitalizeName(newForm.cargo.trim()),
        centro_custo: newForm.centro_custo.trim(),
        contrato: newForm.contrato.trim() || null,
        site_contrato: newForm.site_contrato.trim(),
        data_admissao: newForm.data_admissao || new Date().toISOString().slice(0, 10),
        status: newForm.status,
      };
      const { error } = await supabase.from("colaboradores").insert(record as any);
      if (error) throw error;
      await logAction({
        modulo: "Dep. Pessoal", pagina: "Efetivo", acao: "criacao",
        descricao: `Cadastrou manualmente o colaborador ${record.nome}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      toast.success("Colaborador cadastrado com sucesso!");
      setShowAddNew(false);
      setNewForm({ nome: "", cpf: "", data_nascimento: "", sexo: "", telefone: "", cargo: "", centro_custo: "", contrato: "", site_contrato: "", data_admissao: "", status: "Ativo" });
    } catch {
      toast.error("Erro ao cadastrar colaborador.");
    } finally {
      setSavingNew(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const deleteCountLabel = deleteTarget === "single" ? "1" : String(selectedIds.size);
  const singleDeleteName = singleDeleteId ? formatFirstLastName(colaboradores.find((c) => c.id === singleDeleteId)?.nome || "") : "";

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl font-bold text-foreground">Efetivo</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={downloadModelo}>
            <FileDown className="h-4 w-4 mr-1" /> Baixar modelo
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar arquivo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              exportColaboradores(colaboradores as any);
              logAction({
                modulo: "Dep. Pessoal", pagina: "Efetivo", acao: "exportacao",
                descricao: `Exportou ${colaboradores.length} colaboradores do efetivo.`,
              });
            }}
            disabled={colaboradores.length === 0}
          >
            <Download className="h-4 w-4 mr-1" /> Exportar arquivo
          </Button>
          <Button size="sm" onClick={() => setShowAddNew(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo Colaborador
          </Button>
        </div>
      </div>

      {isMaster && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
          <span className="text-sm font-medium text-destructive">
            {selectedIds.size} selecionado(s)
          </span>
          <Button variant="destructive" size="sm" onClick={handleDeleteMass}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir selecionados
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
            Limpar seleção
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : colaboradores.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">Nenhum colaborador no efetivo.</CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  {isMaster && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredColaboradores.length > 0 && selectedIds.size === filteredColaboradores.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                  )}
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead>Data de Admissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28">Ações</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  {isMaster && <TableHead></TableHead>}
                  <TableHead></TableHead>
                  <TableHead className="py-1.5">
                    <Input placeholder="Filtrar..." value={filterNome} onChange={(e) => setFilterNome(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1.5">
                    <Input placeholder="Filtrar..." value={filterCargo} onChange={(e) => setFilterCargo(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1.5">
                    <Input placeholder="Filtrar..." value={filterCentroCusto} onChange={(e) => setFilterCentroCusto(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead className="py-1.5">
                    <Input placeholder="Filtrar..." value={filterSite} onChange={(e) => setFilterSite(e.target.value)} className="h-7 text-xs" />
                  </TableHead>
                  <TableHead></TableHead>
                  <TableHead className="py-1.5">
                    <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                        <SelectItem value="Afastado">Afastado</SelectItem>
                        <SelectItem value="Desligado">Desligado</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredColaboradores.map((c) => {
                  const fotoUrl = c.vaga_id ? fotos[c.vaga_id] : undefined;
                  return (
                    <TableRow
                      key={c.id}
                      className={`cursor-pointer hover:bg-muted/50 ${selectedIds.has(c.id) ? "bg-destructive/5" : ""}`}
                      onClick={() => navigate(`/departamento-pessoal/efetivo/${c.id}`)}
                    >
                      {isMaster && (
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={fotoUrl} />
                          <AvatarFallback className="text-xs bg-muted">
                            {fotoUrl ? getInitials(c.nome) : <UserIcon className="h-4 w-4" />}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">{formatFirstLastName(c.nome)}</TableCell>
                      <TableCell>{c.cargo}</TableCell>
                      <TableCell>{c.centro_custo}</TableCell>
                      <TableCell>{c.site_contrato}</TableCell>
                      <TableCell>{new Date(c.data_admissao).toLocaleDateString("pt-BR")}</TableCell>
                      <TableCell>
                        <Badge variant={c.status === "Ativo" ? "default" : "secondary"}>{c.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => openEdit(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" title="Histórico" onClick={() => setHistColaboradorId(c.id)}><History className="h-4 w-4" /></Button>
                          {isMaster && (
                            <Button variant="ghost" size="icon" title="Excluir" onClick={() => handleDeleteSingle(c.id)} className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editColaborador} onOpenChange={() => setEditColaborador(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Dados do Colaborador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome</Label><Input value={editForm.nome} onChange={(e) => setEditForm((p) => ({ ...p, nome: e.target.value }))} /></div>
            <div><Label>Cargo / Função</Label><Input value={editForm.cargo} onChange={(e) => setEditForm((p) => ({ ...p, cargo: e.target.value }))} /></div>
            <div><Label>Centro de Custo</Label><Input value={editForm.centro_custo} onChange={(e) => setEditForm((p) => ({ ...p, centro_custo: e.target.value }))} /></div>
            <div><Label>Site / Contrato</Label><Input value={editForm.site_contrato} onChange={(e) => setEditForm((p) => ({ ...p, site_contrato: e.target.value }))} /></div>
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
              <Textarea placeholder="Descreva o motivo da alteração" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
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
          <DialogHeader><DialogTitle>Histórico de Alterações</DialogTitle></DialogHeader>
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma alteração registrada.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-auto">
              {historico.map((h) => (
                <div key={h.id} className="border border-border rounded-md p-3 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">{h.campo_alterado}</span>
                    <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="text-muted-foreground"><span className="line-through">{h.valor_anterior || "—"}</span> → {h.valor_novo || "—"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Motivo: {h.motivo}</p>
                  <p className="text-xs text-muted-foreground">Por: {formatFirstLastName(h.alterado_por)}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ImportColaboradoresDialog open={showImport} onOpenChange={setShowImport} />

      {/* Add New Dialog */}
      <Dialog open={showAddNew} onOpenChange={(v) => { setShowAddNew(v); if (!v) setNewForm({ nome: "", cpf: "", data_nascimento: "", sexo: "", telefone: "", cargo: "", centro_custo: "", contrato: "", site_contrato: "", data_admissao: "", status: "Ativo" }); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Novo Colaborador</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome Completo *</Label><Input value={newForm.nome} onChange={(e) => setNewForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome completo" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>CPF</Label><Input value={newForm.cpf} onChange={(e) => setNewForm((p) => ({ ...p, cpf: e.target.value }))} placeholder="000.000.000-00" /></div>
              <div><Label>Data de Nascimento</Label><Input type="date" value={newForm.data_nascimento} onChange={(e) => setNewForm((p) => ({ ...p, data_nascimento: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sexo</Label>
                <Select value={newForm.sexo} onValueChange={(v) => setNewForm((p) => ({ ...p, sexo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Telefone</Label><Input value={newForm.telefone} onChange={(e) => setNewForm((p) => ({ ...p, telefone: e.target.value }))} placeholder="(00) 00000-0000" /></div>
            </div>
            <div><Label>Cargo / Função *</Label><Input value={newForm.cargo} onChange={(e) => setNewForm((p) => ({ ...p, cargo: e.target.value }))} placeholder="Ex: Engenheiro Civil" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Centro de Custo *</Label><Input value={newForm.centro_custo} onChange={(e) => setNewForm((p) => ({ ...p, centro_custo: e.target.value }))} /></div>
              <div><Label>Site / Contrato *</Label><Input value={newForm.site_contrato} onChange={(e) => setNewForm((p) => ({ ...p, site_contrato: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Contrato</Label><Input value={newForm.contrato} onChange={(e) => setNewForm((p) => ({ ...p, contrato: e.target.value }))} /></div>
              <div><Label>Data de Admissão</Label><Input type="date" value={newForm.data_admissao} onChange={(e) => setNewForm((p) => ({ ...p, data_admissao: e.target.value }))} /></div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={newForm.status} onValueChange={(v) => setNewForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Afastado">Afastado</SelectItem>
                  <SelectItem value="Desligado">Desligado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddNew(false)}>Cancelar</Button>
            <Button onClick={handleAddNew} disabled={savingNew}>
              {savingNew ? "Salvando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget === "single"
                ? `Tem certeza que deseja excluir o colaborador "${singleDeleteName}"? Esta ação não pode ser desfeita.`
                : `Tem certeza que deseja excluir ${selectedIds.size} colaborador(es)? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? "Excluindo..." : `Excluir ${deleteCountLabel}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Efetivo;
