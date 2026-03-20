import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, History, User as UserIcon, Upload, Download, FileDown, Plus } from "lucide-react";
import { toast } from "@/lib/toast";
import { capitalizeName } from "@/utils/formatName";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  useColaboradores, useColaboradorHistorico, useUpdateColaborador, type Colaborador,
} from "@/hooks/useColaboradores";
import { useAuthContext } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { formatFirstLastName } from "@/utils/formatName";
import { supabase } from "@/integrations/supabase/client";
import { downloadModelo, exportColaboradores } from "@/utils/colaboradorExcel";
import ImportColaboradoresDialog from "@/components/ImportColaboradoresDialog";

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
  const fotos = useColaboradorFotos(colaboradores);

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

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

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
        </div>
      </div>
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
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead>Data de Admissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
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
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/departamento-pessoal/efetivo/${c.id}`)}
                    >
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
    </div>
  );
};

export default Efetivo;
