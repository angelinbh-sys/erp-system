import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Download, User as UserIcon, FileText, History, Pencil, Save, X, ArrowRightLeft } from "lucide-react";
import { formatFirstLastName } from "@/utils/formatName";
import { useColaboradorHistorico, useUpdateColaborador, type Colaborador } from "@/hooks/useColaboradores";
import { useAdmissaoDocumentos, DOCUMENTOS_OBRIGATORIOS } from "@/hooks/useAdmissaoDocumentos";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";
import { useAuthContext } from "@/contexts/AuthContext";
import VagaTimeline from "@/components/VagaTimeline";
import { toast } from "@/lib/toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ColaboradorDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [vaga, setVaga] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ nome: "", cargo: "", status: "", telefone: "" });
  const [motivo, setMotivo] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferForm, setTransferForm] = useState({ centro_custo: "", site_contrato: "" });
  const [transferMotivo, setTransferMotivo] = useState("");
  const updateColaborador = useUpdateColaborador();

  const { data: historico = [] } = useColaboradorHistorico(id || null);
  const { data: documentos = [] } = useAdmissaoDocumentos(vaga?.id || null);
  const { data: vagaHistorico = [] } = useVagaHistorico(vaga?.id || null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data: colab } = await supabase.from("colaboradores").select("*").eq("id", id).single();
      if (!colab) { setLoading(false); return; }
      setColaborador(colab as Colaborador);

      if (colab.vaga_id) {
        const { data: vagaData } = await supabase.from("vagas").select("*").eq("id", colab.vaga_id).single();
        if (vagaData) setVaga(vagaData);

        const { data: fotoDoc } = await supabase
          .from("admissao_documentos")
          .select("arquivo_path")
          .eq("vaga_id", colab.vaga_id)
          .eq("tipo_documento", "foto_3x4")
          .eq("status", "anexado")
          .maybeSingle();
        if (fotoDoc?.arquivo_path) {
          const { data: urlData } = await supabase.storage.from("admissao-documentos").createSignedUrl(fotoDoc.arquivo_path, 3600);
          if (urlData?.signedUrl) setFotoUrl(urlData.signedUrl);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const startEdit = () => {
    if (!colaborador) return;
    setEditForm({
      nome: colaborador.nome,
      cargo: colaborador.cargo,
      status: colaborador.status,
      telefone: colaborador.telefone || "",
    });
    setMotivo("");
    setEditing(true);
  };

  const startTransfer = () => {
    if (!colaborador) return;
    setTransferForm({
      centro_custo: colaborador.centro_custo,
      site_contrato: colaborador.site_contrato,
    });
    setTransferMotivo("");
    setShowTransfer(true);
  };

  const handleSaveTransfer = async () => {
    if (!colaborador || !transferMotivo.trim()) {
      toast.error("O motivo da transferência é obrigatório.");
      return;
    }
    const alteradoPor = formatFirstLastName(profile?.nome) || "Sistema";
    const changes: Array<{ colaborador_id: string; campo_alterado: string; valor_anterior: string | null; valor_novo: string | null; motivo: string; alterado_por: string }> = [];
    const updates: Record<string, unknown> = {};

    const fields = [
      { key: "centro_custo", label: "Centro de Custo" },
      { key: "site_contrato", label: "Site / Contrato" },
    ] as const;

    for (const f of fields) {
      const oldVal = colaborador[f.key as keyof Colaborador] as string | null;
      const newVal = transferForm[f.key as keyof typeof transferForm];
      if ((oldVal || "") !== newVal) {
        updates[f.key] = newVal || null;
        changes.push({ colaborador_id: colaborador.id, campo_alterado: f.label, valor_anterior: oldVal, valor_novo: newVal || null, motivo: transferMotivo.trim(), alterado_por: alteradoPor });
      }
    }

    if (Object.keys(updates).length === 0) { toast.info("Nenhuma alteração detectada."); return; }

    try {
      await updateColaborador.mutateAsync({ id: colaborador.id, updates, historico: changes });
      setColaborador(prev => prev ? { ...prev, ...updates } as Colaborador : prev);
      toast.success("Transferência realizada com sucesso.");
      setShowTransfer(false);
    } catch { toast.error("Erro ao realizar transferência."); }
  };

  const handleSaveEdit = async () => {
    if (!colaborador || !motivo.trim()) {
      toast.error("O motivo da alteração é obrigatório.");
      return;
    }

    const alteradoPor = formatFirstLastName(profile?.nome) || "Sistema";
    const changes: Array<{ colaborador_id: string; campo_alterado: string; valor_anterior: string | null; valor_novo: string | null; motivo: string; alterado_por: string }> = [];
    const updates: Record<string, unknown> = {};

    const fields = [
      { key: "nome", label: "Nome" },
      { key: "cargo", label: "Cargo" },
      { key: "status", label: "Status" },
      { key: "telefone", label: "Telefone" },
    ] as const;

    for (const f of fields) {
      const oldVal = colaborador[f.key as keyof Colaborador] as string | null;
      const newVal = editForm[f.key as keyof typeof editForm];
      if ((oldVal || "") !== newVal) {
        updates[f.key] = newVal || null;
        changes.push({ colaborador_id: colaborador.id, campo_alterado: f.label, valor_anterior: oldVal, valor_novo: newVal || null, motivo: motivo.trim(), alterado_por: alteradoPor });
      }
    }

    if (Object.keys(updates).length === 0) { toast.info("Nenhuma alteração detectada."); return; }

    try {
      await updateColaborador.mutateAsync({ id: colaborador.id, updates, historico: changes });
      setColaborador(prev => prev ? { ...prev, ...updates } as Colaborador : prev);
      toast.success("Dados atualizados com sucesso.");
      setEditing(false);
    } catch { toast.error("Erro ao atualizar dados."); }
  };

  const handleDownloadAll = async () => {
    if (!vaga?.id) return;
    const filesToDownload: { path: string; name: string }[] = [];
    for (const doc of documentos) {
      if (doc.status === "anexado" && doc.arquivo_path) {
        filesToDownload.push({ path: doc.arquivo_path, name: doc.arquivo_nome || doc.tipo_documento });
      }
    }
    if (vaga.resultado_aso_path) {
      filesToDownload.push({ path: vaga.resultado_aso_path, name: vaga.resultado_aso_nome || "resultado-aso" });
    }
    if (filesToDownload.length === 0) { toast.info("Nenhum arquivo disponível para download."); return; }
    toast.info(`Iniciando download de ${filesToDownload.length} arquivo(s)...`);
    for (const file of filesToDownload) {
      try {
        const bucket = file.path.includes("resultado-aso") ? "aso-documentos" : "admissao-documentos";
        const { data } = await supabase.storage.from(bucket).download(file.path);
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url; a.download = file.name;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch { console.error("Erro ao baixar:", file.name); }
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!colaborador) return <div className="max-w-4xl mx-auto"><p className="text-muted-foreground">Colaborador não encontrado.</p></div>;

  const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/departamento-pessoal/efetivo")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="font-heading text-2xl font-bold text-foreground">Dados do Colaborador</h2>
        </div>
        {!editing && (
          <Button variant="outline" size="sm" onClick={startEdit}>
            <Pencil className="h-4 w-4 mr-1" /> Editar Dados
          </Button>
        )}
      </div>

      {/* Header with photo */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-48 w-48">
              <AvatarImage src={fotoUrl || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-muted">
                {fotoUrl ? getInitials(colaborador.nome) : <UserIcon className="h-20 w-20" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{formatFirstLastName(colaborador.nome)}</h3>
              <p className="text-muted-foreground">{colaborador.cargo}</p>
              <div className="mt-2">
                <Badge variant={colaborador.status === "Ativo" ? "default" : "secondary"}>{colaborador.status}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editing Mode */}
      {editing && (
        <Card className="mb-6 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Pencil className="h-4 w-4" /> Editar Dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input value={editForm.nome} onChange={e => setEditForm(p => ({ ...p, nome: e.target.value }))} /></div>
              <div><Label>Cargo / Função</Label><Input value={editForm.cargo} onChange={e => setEditForm(p => ({ ...p, cargo: e.target.value }))} /></div>
              <div><Label>Centro de Custo</Label><Input value={editForm.centro_custo} onChange={e => setEditForm(p => ({ ...p, centro_custo: e.target.value }))} /></div>
              <div><Label>Site / Contrato</Label><Input value={editForm.site_contrato} onChange={e => setEditForm(p => ({ ...p, site_contrato: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={editForm.telefone} onChange={e => setEditForm(p => ({ ...p, telefone: e.target.value }))} /></div>
              <div>
                <Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v }))}>
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
            <div>
              <Label>Motivo da Alteração *</Label>
              <Textarea placeholder="Descreva o motivo da alteração" value={motivo} onChange={e => setMotivo(e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
              <Button size="sm" onClick={handleSaveEdit} disabled={updateColaborador.isPending}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Pessoais */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">👤 Dados Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoField label="Nome Completo" value={colaborador.nome} />
            <InfoField label="Cargo / Função" value={colaborador.cargo} />
            <InfoField label="Status" value={colaborador.status} />
            <InfoField label="Data de Admissão" value={new Date(colaborador.data_admissao).toLocaleDateString("pt-BR")} />
            {colaborador.data_nascimento && <InfoField label="Data de Nascimento" value={new Date(colaborador.data_nascimento).toLocaleDateString("pt-BR")} />}
            {colaborador.telefone && <InfoField label="Telefone" value={colaborador.telefone} />}
            {vaga?.cpf && <InfoField label="CPF" value={vaga.cpf} />}
            {vaga?.sexo && <InfoField label="Sexo" value={vaga.sexo} />}
            {vaga?.salario && <InfoField label="Salário" value={vaga.salario} />}
          </div>
        </CardContent>
      </Card>

      {/* Lotação */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">🏢 Lotação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InfoField label="Centro de Custo" value={colaborador.centro_custo} />
            <InfoField label="Site / Contrato" value={colaborador.site_contrato} />
            {vaga?.local_trabalho && <InfoField label="Local de Trabalho" value={vaga.local_trabalho} />}
          </div>
        </CardContent>
      </Card>

      {/* Endereço */}
      {vaga && (vaga.cep || vaga.logradouro || vaga.cidade) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">📍 Endereço</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {vaga.cep && <InfoField label="CEP" value={vaga.cep} />}
              {vaga.logradouro && <InfoField label="Logradouro" value={vaga.logradouro} />}
              {vaga.numero && <InfoField label="Número" value={vaga.numero} />}
              {vaga.complemento && <InfoField label="Complemento" value={vaga.complemento} />}
              {vaga.bairro && <InfoField label="Bairro" value={vaga.bairro} />}
              {vaga.cidade && <InfoField label="Cidade" value={vaga.cidade} />}
              {vaga.estado && <InfoField label="Estado" value={vaga.estado} />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dados Bancários */}
      {vaga && (vaga.banco || vaga.agencia || vaga.conta) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">🏦 Dados Bancários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <InfoField label="Banco" value={vaga.banco || "—"} />
              <InfoField label="Agência" value={`${vaga.agencia || "—"}${vaga.digito_agencia ? `-${vaga.digito_agencia}` : ""}`} />
              <InfoField label="Conta" value={`${vaga.conta || "—"}${vaga.digito_conta ? `-${vaga.digito_conta}` : ""}`} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {vaga && documentos.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">📋 Documentos Anexados</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                <Download className="h-4 w-4 mr-1" /> Baixar Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {DOCUMENTOS_OBRIGATORIOS.map((doc) => {
              const status = documentos.find((d) => d.tipo_documento === doc.tipo);
              const isAnexado = status?.status === "anexado";
              return (
                <div key={doc.tipo} className={`flex items-center gap-3 p-2 rounded text-sm ${isAnexado ? "bg-green-50/50" : "bg-muted/30"}`}>
                  <FileText className={`h-4 w-4 ${isAnexado ? "text-green-600" : "text-muted-foreground"}`} />
                  <span className="flex-1">{doc.label}</span>
                  <Badge variant="outline" className={isAnexado ? "bg-green-50 text-green-700 border-green-200 text-xs" : "text-xs"}>
                    {isAnexado ? "Anexado" : "Pendente"}
                  </Badge>
                </div>
              );
            })}
            {vaga.curriculo_nome && (
              <div className="flex items-center gap-3 p-2 rounded text-sm bg-green-50/50">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="flex-1">Currículo</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Anexado</Badge>
              </div>
            )}
            {vaga.resultado_aso_nome && (
              <div className="flex items-center gap-3 p-2 rounded text-sm bg-green-50/50">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="flex-1">ASO</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Anexado</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vaga Timeline */}
      {vaga && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fluxo da Vaga</CardTitle>
          </CardHeader>
          <CardContent>
            <VagaTimeline vaga={vaga} historico={vagaHistorico} />
          </CardContent>
        </Card>
      )}

      {/* Histórico de Alterações */}
      {historico.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" /> Histórico de Alterações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ColaboradorDetalhes;
