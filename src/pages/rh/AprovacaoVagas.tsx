import { useState } from "react";
import { toast } from "@/lib/toast";
import { Check, X, Clock, CheckCircle2, XCircle, Trash2, Undo2, Pencil, Ban } from "lucide-react";
import { formatFirstLastName } from "@/utils/formatName";
import VagaTimeline from "@/components/VagaTimeline";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";
import { CriadoPorInfo } from "@/components/CriadoPorInfo";
import { AtualizadoPorInfo } from "@/components/AtualizadoPorInfo";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { useVagas, useUpdateVagaStatus, type Vaga } from "@/hooks/useVagas";
import { useCreateNotificacao } from "@/hooks/useNotificacoes";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { HistoricoRegistro } from "@/components/HistoricoRegistro";
import { STATUS_PROCESSO, STATUS_PROCESSO_CONFIG, getResponsavelEtapa } from "@/utils/statusProcesso";

const statusCandidatoConfig: Record<string, { label: string; className: string }> = {
  "Em análise": { label: "Em análise", className: "bg-blue-100 text-blue-800 border-blue-300" },
  "Aprovado": { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-300" },
  "Reprovado": { label: "Reprovado", className: "bg-red-100 text-red-800 border-red-300" },
};

const AprovacaoVagas = () => {
  const { data: vagas = [], isLoading } = useVagas();
  const updateStatus = useUpdateVagaStatus();
  const createNotificacao = useCreateNotificacao();
  const { profile, user } = useAuthContext();
  const { logAction } = useAuditLog();

  const isSuperAdmin = profile?.super_admin;
  const grupoLower = profile?.grupo_permissao?.toLowerCase() || "";
  const isDiretoria = isSuperAdmin || grupoLower === "diretoria";

  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [showReprovar, setShowReprovar] = useState(false);
  const [observacao, setObservacao] = useState("");

  // Edit devolvida
  const [editVaga, setEditVaga] = useState<Vaga | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editSaving, setEditSaving] = useState(false);

  const [deleteVaga, setDeleteVaga] = useState<Vaga | null>(null);
  const [deleteMotivo, setDeleteMotivo] = useState("");
  const [deleting, setDeleting] = useState(false);

  const [cancelVaga, setCancelVaga] = useState<Vaga | null>(null);
  const [cancelMotivo, setCancelMotivo] = useState("");
  const [cancelling, setCancelling] = useState(false);

  // Devolver pela Diretoria
  const [devolverVaga, setDevolverVaga] = useState<Vaga | null>(null);
  const [devolverMotivo, setDevolverMotivo] = useState("");
  const [devolvendo, setDevolvendo] = useState(false);

  // Filter vagas
  const notExcluded = vagas.filter((v) => !(v as any).excluida && (v as any).status_processo !== STATUS_PROCESSO.VAGA_CANCELADA);
  const activeVagas = notExcluded.filter((v) => (v as any).status_processo === STATUS_PROCESSO.AGUARDANDO_DIRETORIA || v.status === "Aguardando Aprovação");
  const devolvidasVagas = notExcluded.filter((v) => (v as any).status_processo === STATUS_PROCESSO.DEVOLVIDO_RH || v.status === "Devolvida SESMT");
  const reprovadasVagas = notExcluded.filter((v) => (v as any).status_processo === STATUS_PROCESSO.REPROVADO_DIRETORIA || v.status === "Reprovada");
  const canceladasVagas = vagas.filter((v) => (v as any).status_processo === STATUS_PROCESSO.VAGA_CANCELADA && !(v as any).excluida);

  const isCreator = (vaga: Vaga) => {
    const criadoPor = (vaga as any).criado_por;
    return criadoPor && user && criadoPor === user.id;
  };

  const canEditVaga = (vaga: Vaga) => {
    const sp = (vaga as any).status_processo;
    return (isCreator(vaga) || isSuperAdmin) && (sp === STATUS_PROCESSO.DEVOLVIDO_RH || sp === STATUS_PROCESSO.REPROVADO_DIRETORIA);
  };

  const canDeleteVaga = (vaga: Vaga) => {
    const sp = (vaga as any).status_processo;
    // Super admin pode excluir em qualquer status
    if (isSuperAdmin) return true;
    return isCreator(vaga) && (sp === STATUS_PROCESSO.RASCUNHO || sp === STATUS_PROCESSO.AGUARDANDO_DIRETORIA);
  };

  // Cancelar vaga: apenas o criador
  const canCancelVaga = (vaga: Vaga) => {
    const sp = (vaga as any).status_processo;
    return isCreator(vaga) && sp !== STATUS_PROCESSO.VAGA_CANCELADA && sp !== STATUS_PROCESSO.EFETIVADO;
  };

  const handleReenviar = async (vaga: Vaga) => {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({
          status: "Aguardando Aprovação",
          status_processo: STATUS_PROCESSO.AGUARDANDO_DIRETORIA,
          responsavel_etapa: "Diretoria",
          atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
        } as any)
        .eq("id", vaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: vaga.id,
        acao: "Reenviada pelo RH para aprovação",
        usuario_nome: formatFirstLastName(profile?.nome) || "Sistema",
      } as any);

      await createNotificacao.mutateAsync({
        titulo: "Vaga reenviada para aprovação",
        mensagem: `A vaga ${vaga.cargo} (${vaga.nome_candidato}) foi corrigida e reenviada para aprovação.`,
        tipo: "warning",
        link: "/rh/aprovacao-vaga",
        vaga_id: vaga.id,
        destinatario_grupo: "Diretoria",
      });

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "reenvio",
        descricao: `Reenviou vaga para aprovação: ${vaga.cargo} — ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      toast.success("Vaga reenviada para aprovação da Diretoria.");
      window.location.reload();
    } catch {
      toast.error("Erro ao reenviar vaga.");
    }
  };

  const handleAprovar = async (vaga: Vaga) => {
    try {
      const { error } = await supabase.from("vagas").update({
        status: "Aprovada",
        status_processo: STATUS_PROCESSO.EM_ANDAMENTO_SESMT,
        responsavel_etapa: "SESMT",
        atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
      } as any).eq("id", vaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: vaga.id, acao: "Aprovada pela Diretoria", usuario_nome: formatFirstLastName(profile?.nome) || "Sistema",
      } as any);

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "aprovacao",
        descricao: `Aprovou vaga: ${vaga.cargo} — ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      await createNotificacao.mutateAsync({
        titulo: "Vaga aprovada",
        mensagem: `A vaga ${vaga.cargo} para ${vaga.nome_candidato} foi aprovada. Encaminhar para agendamento de ASO.`,
        tipo: "success", link: "/sesmt/agendamento-aso", vaga_id: vaga.id,
        destinatario_grupo: "SESMT",
      });

      toast.success("Vaga aprovada com sucesso!");
      window.location.reload();
    } catch {
      toast.error("Erro ao aprovar vaga.");
    }
  };

  const handleReprovar = async () => {
    if (!selectedVaga) return;
    try {
      const { error } = await supabase.from("vagas").update({
        status: "Reprovada",
        status_processo: STATUS_PROCESSO.REPROVADO_DIRETORIA,
        responsavel_etapa: "RH",
        observacao_reprovacao: observacao.trim() || null,
        atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
      } as any).eq("id", selectedVaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: selectedVaga.id, acao: "Reprovada pela Diretoria", usuario_nome: formatFirstLastName(profile?.nome) || "Sistema", motivo: observacao.trim() || null,
      } as any);

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "reprovacao",
        descricao: `Reprovou vaga: ${selectedVaga.cargo} — ${selectedVaga.nome_candidato}`,
        registro_id: selectedVaga.id, registro_ref: `${selectedVaga.cargo} - ${selectedVaga.nome_candidato}`,
        motivo: observacao.trim() || undefined,
      });

      toast.success("Vaga reprovada.");
      setShowReprovar(false);
      setSelectedVaga(null);
      setObservacao("");
      window.location.reload();
    } catch {
      toast.error("Erro ao reprovar vaga.");
    }
  };

  // Devolver pela Diretoria -> volta para o criador
  const handleDevolver = async () => {
    if (!devolverVaga || !devolverMotivo.trim()) {
      toast.error("O motivo da devolução é obrigatório.");
      return;
    }
    setDevolvendo(true);
    try {
      const { error } = await supabase.from("vagas").update({
        status: "Devolvida Diretoria",
        status_processo: STATUS_PROCESSO.DEVOLVIDO_RH,
        responsavel_etapa: "RH",
        observacao_reprovacao: devolverMotivo.trim(),
        atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
      } as any).eq("id", devolverVaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: devolverVaga.id,
        acao: "Devolvida pela Diretoria para correção",
        usuario_nome: formatFirstLastName(profile?.nome) || "Sistema",
        motivo: devolverMotivo.trim(),
      } as any);

      await createNotificacao.mutateAsync({
        titulo: "Vaga devolvida pela Diretoria",
        mensagem: `A vaga ${devolverVaga.cargo} (${devolverVaga.nome_candidato}) foi devolvida pela Diretoria para correção. Motivo: ${devolverMotivo.trim()}`,
        tipo: "warning",
        link: "/rh/aprovacao-vaga",
        vaga_id: devolverVaga.id,
        destinatario_grupo: "RH",
      });

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "devolucao",
        descricao: `Devolveu vaga para correção: ${devolverVaga.cargo} — ${devolverVaga.nome_candidato}`,
        registro_id: devolverVaga.id, registro_ref: `${devolverVaga.cargo} - ${devolverVaga.nome_candidato}`,
        motivo: devolverMotivo.trim(),
      });

      toast.success("Vaga devolvida para correção.");
      setDevolverVaga(null);
      setDevolverMotivo("");
      window.location.reload();
    } catch {
      toast.error("Erro ao devolver vaga.");
    } finally {
      setDevolvendo(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteVaga || !deleteMotivo.trim()) {
      toast.error("O motivo da exclusão é obrigatório.");
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase.from("vagas").update({
        excluida: true, motivo_exclusao: deleteMotivo.trim(), excluida_at: new Date().toISOString(),
      } as any).eq("id", deleteVaga.id);
      if (error) throw error;

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "exclusao",
        descricao: `Excluiu vaga: ${deleteVaga.cargo} — ${deleteVaga.nome_candidato}`,
        registro_id: deleteVaga.id, registro_ref: `${deleteVaga.cargo} - ${deleteVaga.nome_candidato}`,
        motivo: deleteMotivo.trim(),
      });

      toast.success("Vaga excluída com sucesso.");
      setDeleteVaga(null);
      setDeleteMotivo("");
      window.location.reload();
    } catch {
      toast.error("Erro ao excluir vaga.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelVaga = async () => {
    if (!cancelVaga || !cancelMotivo.trim()) {
      toast.error("O motivo do cancelamento é obrigatório.");
      return;
    }
    setCancelling(true);
    try {
      const { error } = await supabase.from("vagas").update({
        status_processo: STATUS_PROCESSO.VAGA_CANCELADA,
        responsavel_etapa: "—",
        atualizado_por: formatFirstLastName(profile?.nome) || "Sistema",
      } as any).eq("id", cancelVaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: cancelVaga.id, acao: "Vaga cancelada", usuario_nome: formatFirstLastName(profile?.nome) || "Sistema", motivo: cancelMotivo.trim(),
      } as any);

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "cancelamento",
        descricao: `Cancelou vaga ${(cancelVaga as any).numero_vaga || ""}: ${cancelVaga.cargo} — ${cancelVaga.nome_candidato}`,
        registro_id: cancelVaga.id, registro_ref: `${cancelVaga.cargo} - ${cancelVaga.nome_candidato}`,
        motivo: cancelMotivo.trim(),
      });

      toast.success("Vaga cancelada com sucesso.");
      setCancelVaga(null);
      setCancelMotivo("");
      window.location.reload();
    } catch {
      toast.error("Erro ao cancelar vaga.");
    } finally {
      setCancelling(false);
    }
  };

  const handleStatusCandidatoChange = async (vaga: Vaga, newStatus: string) => {
    try {
      await supabase.from("vagas").update({
        status_candidato: newStatus, status_candidato_updated_at: new Date().toISOString(),
      } as any).eq("id", vaga.id);

      await logAction({
        modulo: "Recursos Humanos", pagina: "Aprovação de Vaga", acao: "alteracao_status",
        descricao: `Alterou status do candidato para "${newStatus}": ${vaga.cargo} — ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      toast.success(`Status do candidato alterado para "${newStatus}".`);
      window.location.reload();
    } catch {
      toast.error("Erro ao alterar status do candidato.");
    }
  };

  const getStatusProcessoBadge = (statusProcesso: string) => {
    const config = STATUS_PROCESSO_CONFIG[statusProcesso] || { label: statusProcesso, className: "bg-muted text-muted-foreground" };
    return <Badge variant="outline" className={`gap-1 ${config.className}`}>{config.label}</Badge>;
  };

  const getCandidatoStatusBadge = (status: string) => {
    const config = statusCandidatoConfig[status] || statusCandidatoConfig["Em análise"];
    return <Badge variant="outline" className={`gap-1 ${config.className}`}>{config.label}</Badge>;
  };

  const beneficiosToString = (b: unknown) => {
    if (!b || typeof b !== "object") return "—";
    const obj = b as Record<string, unknown>;
    const items: string[] = [];
    if (obj.va) items.push(`VA: ${obj.vaValor || "Sim"}`);
    if (obj.auxilioMoradia) items.push(`Aux. Moradia: ${obj.auxilioMoradiaValor || "Sim"}`);
    if (obj.assiduidade) items.push(`Assiduidade: ${obj.assiduidadeValor || "Sim"}`);
    if (obj.ajudaCusto) items.push(`Ajuda de Custo: ${obj.ajudaCustoValor || "Sim"}`);
    if (obj.planoSaude) items.push("Plano de Saúde");
    if (obj.planoOdontologico) items.push("Plano Odontológico");
    return items.length > 0 ? items.join(", ") : "Nenhum";
  };

  const renderVagaTable = (vagasList: Vaga[], title: string, showActions: boolean) => {
    if (vagasList.length === 0) return null;
    return (
      <>
        {title && <h3 className="font-heading text-xl font-bold text-foreground mt-8 mb-4">{title}</h3>}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Status do Processo</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="w-52">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasList.map((vaga) => (
                  <TableRow key={vaga.id}>
                    <TableCell className="font-mono text-xs text-primary">{(vaga as any).numero_vaga || "—"}</TableCell>
                    <TableCell className="font-medium">{vaga.nome_candidato}</TableCell>
                    <TableCell>{vaga.cargo}</TableCell>
                    <TableCell>{vaga.centro_custo_nome}</TableCell>
                    <TableCell>{getStatusProcessoBadge((vaga as any).status_processo || "Aguardando Diretoria")}</TableCell>
                    <TableCell className="text-sm">{(vaga as any).responsavel_etapa || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {showActions && isDiretoria && (vaga as any).status_processo === STATUS_PROCESSO.AGUARDANDO_DIRETORIA && (
                          <>
                            <Button variant="ghost" size="icon" title="Aprovar" onClick={() => handleAprovar(vaga)}
                              className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))]">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Reprovar" onClick={() => { setSelectedVaga(vaga); setObservacao(""); setShowReprovar(true); }}
                              className="text-destructive hover:text-destructive">
                              <X className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Devolver" onClick={() => { setDevolverVaga(vaga); setDevolverMotivo(""); }}
                              className="text-orange-600 hover:text-orange-600">
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canEditVaga(vaga) && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditVaga(vaga);
                              setEditForm({
                                nome_candidato: vaga.nome_candidato || "",
                                cargo: vaga.cargo || "",
                                salario: vaga.salario || "",
                                telefone: vaga.telefone || "",
                                cpf: (vaga as any).cpf || "",
                                sexo: (vaga as any).sexo || "",
                              });
                            }}>
                              <Pencil className="h-4 w-4 mr-1" /> Editar dados
                            </Button>
                            <Button size="sm" onClick={() => handleReenviar(vaga)}>
                              Reenviar para Aprovação
                            </Button>
                          </>
                        )}
                        {canDeleteVaga(vaga) && (
                          <Button variant="ghost" size="icon" title="Excluir vaga"
                            onClick={() => { setDeleteVaga(vaga); setDeleteMotivo(""); }}
                            className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                        {canCancelVaga(vaga) && (
                          <Button variant="ghost" size="icon" title="Cancelar vaga"
                            onClick={() => { setCancelVaga(vaga); setCancelMotivo(""); }}
                            className="text-orange-600 hover:text-orange-600">
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Aprovação de Vaga
      </h2>

      {!isDiretoria && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
          Você pode visualizar as vagas e seus status, mas apenas membros do grupo <strong>Diretoria</strong> podem aprovar, reprovar ou devolver.
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : activeVagas.length === 0 && devolvidasVagas.length === 0 && reprovadasVagas.length === 0 && canceladasVagas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma vaga cadastrada.
          </CardContent>
        </Card>
      ) : (
        <>
          {renderVagaTable(activeVagas, activeVagas.length > 0 ? "" : "", true)}
          {renderVagaTable(devolvidasVagas, "Vagas Devolvidas", true)}
          {renderVagaTable(reprovadasVagas, "Vagas Reprovadas", true)}
          {renderVagaTable(canceladasVagas, "Vagas Canceladas", true)}
        </>
      )}

      {/* Reprovar Dialog */}
      <Dialog open={showReprovar} onOpenChange={() => setShowReprovar(false)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reprovar Vaga</DialogTitle></DialogHeader>
          <Textarea placeholder="Motivo da reprovação (obrigatório)" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReprovar(false)}>Cancelar</Button>
            <Button onClick={handleReprovar} disabled={!observacao.trim()}>Reprovar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Devolver Dialog */}
      <Dialog open={!!devolverVaga} onOpenChange={() => setDevolverVaga(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Devolver Vaga para Correção</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Devolver a vaga <strong>{devolverVaga?.cargo}</strong> do candidato <strong>{devolverVaga?.nome_candidato}</strong> para o solicitante corrigir.
          </p>
          <div className="space-y-2">
            <Label>Motivo da Devolução *</Label>
            <Textarea placeholder="Informe o motivo da devolução" value={devolverMotivo} onChange={(e) => setDevolverMotivo(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolverVaga(null)}>Cancelar</Button>
            <Button onClick={handleDevolver} disabled={devolvendo || !devolverMotivo.trim()}>
              {devolvendo ? "Devolvendo..." : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteVaga} onOpenChange={() => setDeleteVaga(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Excluir Vaga</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Excluir a vaga <strong>{deleteVaga?.cargo}</strong> do candidato <strong>{deleteVaga?.nome_candidato}</strong>?
          </p>
          <Textarea placeholder="Motivo da exclusão (obrigatório)" value={deleteMotivo} onChange={(e) => setDeleteMotivo(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVaga(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || !deleteMotivo.trim()}>
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={!!cancelVaga} onOpenChange={() => setCancelVaga(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar Vaga</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cancelar a vaga <strong>{(cancelVaga as any)?.numero_vaga}</strong> — <strong>{cancelVaga?.cargo}</strong> do candidato <strong>{cancelVaga?.nome_candidato}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">A vaga permanecerá no sistema para histórico, mas não poderá mais avançar no fluxo.</p>
          <Textarea placeholder="Motivo do cancelamento (obrigatório)" value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelVaga(null)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancelVaga} disabled={cancelling || !cancelMotivo.trim()}>
              {cancelling ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovacaoVagas;
