import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Eye, Clock, CheckCircle2, XCircle, Trash2, Undo2 } from "lucide-react";
import VagaTimeline from "@/components/VagaTimeline";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";
import { CriadoPorInfo } from "@/components/CriadoPorInfo";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useVagas, useUpdateVagaStatus, type Vaga } from "@/hooks/useVagas";
import { useCreateNotificacao } from "@/hooks/useNotificacoes";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuditLog } from "@/hooks/useAuditLog";
import { HistoricoRegistro } from "@/components/HistoricoRegistro";

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  "Aguardando Aprovação": {
    label: "Aguardando Aprovação",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  "Aprovada": {
    label: "Aprovada",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-green-100 text-green-800 border-green-300",
  },
  "Reprovada": {
    label: "Reprovada",
    icon: <XCircle className="h-3 w-3" />,
    className: "bg-red-100 text-red-800 border-red-300",
  },
  "Devolvida SESMT": {
    label: "Devolvida pelo SESMT",
    icon: <Undo2 className="h-3 w-3" />,
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
};

const statusCandidatoConfig: Record<string, { label: string; className: string }> = {
  "Em análise": { label: "Em análise", className: "bg-blue-100 text-blue-800 border-blue-300" },
  "Aprovado": { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-300" },
  "Reprovado": { label: "Reprovado", className: "bg-red-100 text-red-800 border-red-300" },
};

function DetailDialogContent({ vaga, getStatusBadge, getCandidatoStatusBadge, beneficiosToString, handleStatusCandidatoChange }: {
  vaga: any;
  getStatusBadge: (s: string) => React.ReactNode;
  getCandidatoStatusBadge: (s: string) => React.ReactNode;
  beneficiosToString: (b: unknown) => string;
  handleStatusCandidatoChange: (v: any, s: string) => void;
}) {
  const { data: historico = [] } = useVagaHistorico(vaga.id);

  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div><strong>Cargo:</strong> {vaga.cargo}</div>
        <div><strong>Salário:</strong> {vaga.salario}</div>
        <div><strong>Centro de Custo:</strong> {vaga.centro_custo_nome}</div>
        <div><strong>Site / Contrato:</strong> {vaga.site_contrato}</div>
        <div><strong>Local:</strong> {vaga.local_trabalho}</div>
        <div><strong>Candidato:</strong> {vaga.nome_candidato}</div>
        <div><strong>Nascimento:</strong> {vaga.data_nascimento}</div>
        <div><strong>Telefone:</strong> {vaga.telefone}</div>
      </div>
      <div><strong>Benefícios:</strong> {beneficiosToString(vaga.beneficios)}</div>
      <CriadoPorInfo criadoPorId={(vaga as any).criado_por} criadoEm={vaga.created_at} className="mt-2" />
      <div><strong>Status da Vaga:</strong> {getStatusBadge(vaga.status)}</div>
      <div><strong>Status do Candidato:</strong> {getCandidatoStatusBadge(vaga.status_candidato || "Em análise")}</div>
      {vaga.observacao_reprovacao && (
        <div><strong>Motivo da reprovação:</strong> {vaga.observacao_reprovacao}</div>
      )}

      {/* Timeline */}
      <div className="pt-3 border-t border-border">
        <VagaTimeline vaga={vaga} historico={historico} />
      </div>

      {/* Histórico de Auditoria */}
      <div className="pt-3 border-t border-border">
        <HistoricoRegistro registroId={vaga.id} />
      </div>

      {/* Status do Candidato - editable */}
      <div className="pt-3 border-t border-border">
        <Label className="text-sm font-semibold">Alterar Status do Candidato</Label>
        <Select
          value={vaga.status_candidato || "Em análise"}
          onValueChange={(v) => handleStatusCandidatoChange(vaga, v)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Em análise">Em análise</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Reprovado">Reprovado</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const AprovacaoVagas = () => {
  const { data: vagas = [], isLoading } = useVagas();
  const updateStatus = useUpdateVagaStatus();
  const createNotificacao = useCreateNotificacao();
  const { profile, user } = useAuthContext();
  const { logAction } = useAuditLog();

  const isDiretoria = profile?.super_admin || profile?.grupo_permissao?.toLowerCase() === "diretoria";

  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [showReprovar, setShowReprovar] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [detailVaga, setDetailVaga] = useState<Vaga | null>(null);

  // Delete state
  const [deleteVaga, setDeleteVaga] = useState<Vaga | null>(null);
  const [deleteMotivo, setDeleteMotivo] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Filter: pending approvals + devolved from SESMT, exclude deleted
  const activeVagas = vagas.filter((v) => !(v as Record<string, unknown>).excluida && v.status === "Aguardando Aprovação");
  const devolvidasVagas = vagas.filter((v) => !(v as Record<string, unknown>).excluida && v.status === "Devolvida SESMT");

  const handleReenviar = async (vaga: Vaga) => {
    try {
      const { error } = await supabase
        .from("vagas")
        .update({ status: "Aguardando Aprovação" } as any)
        .eq("id", vaga.id);
      if (error) throw error;

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: vaga.id,
        acao: "Reenviada pelo RH para aprovação",
        usuario_nome: profile?.nome || "Sistema",
      } as any);

      await createNotificacao.mutateAsync({
        titulo: "Vaga reenviada para aprovação",
        mensagem: `A vaga ${vaga.cargo} (${vaga.nome_candidato}) foi corrigida e reenviada para aprovação.`,
        tipo: "warning",
        link: "/rh/aprovacao-vagas",
        vaga_id: vaga.id,
      });

      await logAction({
        modulo: "Recursos Humanos",
        pagina: "Aprovação de Vagas",
        acao: "reenvio",
        descricao: `Reenviou vaga para aprovação: ${vaga.cargo} — ${vaga.nome_candidato}`,
        registro_id: vaga.id,
        registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      toast.success("Vaga reenviada para aprovação da Diretoria.");
      window.location.reload();
    } catch {
      toast.error("Erro ao reenviar vaga.");
    }
  };

  const handleAprovar = async (vaga: Vaga) => {
    try {
      await updateStatus.mutateAsync({ id: vaga.id, status: "Aprovada" });
      await logAction({
        modulo: "Recursos Humanos",
        pagina: "Aprovação de Vagas",
        acao: "aprovacao",
        descricao: `Aprovou vaga: ${vaga.cargo} — ${vaga.nome_candidato}`,
        registro_id: vaga.id,
        registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });
      await createNotificacao.mutateAsync({
        titulo: "Vaga aprovada",
        mensagem: `A vaga ${vaga.cargo} para ${vaga.nome_candidato} foi aprovada. Encaminhar para agendamento de ASO.`,
        tipo: "success",
        link: "/sesmt/agendamento-aso",
        vaga_id: vaga.id,
      });
      toast.success("Vaga aprovada com sucesso!");
    } catch {
      toast.error("Erro ao aprovar vaga.");
    }
  };

  const handleReprovar = async () => {
    if (!selectedVaga) return;
    try {
      await updateStatus.mutateAsync({
        id: selectedVaga.id,
        status: "Reprovada",
        observacao: observacao.trim() || undefined,
      });
      await logAction({
        modulo: "Recursos Humanos",
        pagina: "Aprovação de Vagas",
        acao: "reprovacao",
        descricao: `Reprovou vaga: ${selectedVaga.cargo} — ${selectedVaga.nome_candidato}`,
        registro_id: selectedVaga.id,
        registro_ref: `${selectedVaga.cargo} - ${selectedVaga.nome_candidato}`,
        motivo: observacao.trim() || undefined,
      });
      toast.success("Vaga reprovada.");
      setShowReprovar(false);
      setSelectedVaga(null);
      setObservacao("");
    } catch {
      toast.error("Erro ao reprovar vaga.");
    }
  };

  const openReprovar = (vaga: Vaga) => {
    setSelectedVaga(vaga);
    setObservacao("");
    setShowReprovar(true);
  };

  const handleDelete = async () => {
    if (!deleteVaga || !deleteMotivo.trim()) {
      toast.error("O motivo da exclusão é obrigatório.");
      return;
    }
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("vagas")
        .update({
          excluida: true,
          motivo_exclusao: deleteMotivo.trim(),
          excluida_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", deleteVaga.id);
      if (error) throw error;
      await logAction({
        modulo: "Recursos Humanos",
        pagina: "Aprovação de Vagas",
        acao: "exclusao",
        descricao: `Excluiu vaga: ${deleteVaga.cargo} — ${deleteVaga.nome_candidato}`,
        registro_id: deleteVaga.id,
        registro_ref: `${deleteVaga.cargo} - ${deleteVaga.nome_candidato}`,
        motivo: deleteMotivo.trim(),
      });
      toast.success("Vaga excluída com sucesso.");
      setDeleteVaga(null);
      setDeleteMotivo("");
      // Refetch
      window.location.reload();
    } catch {
      toast.error("Erro ao excluir vaga.");
    } finally {
      setDeleting(false);
    }
  };

  const canDeleteVaga = (vaga: Vaga) => {
    const criadoPor = (vaga as Record<string, unknown>).criado_por;
    return criadoPor && user && criadoPor === user.id;
  };

  const handleStatusCandidatoChange = async (vaga: Vaga, newStatus: string) => {
    try {
      await supabase
        .from("vagas")
        .update({
          status_candidato: newStatus,
          status_candidato_updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", vaga.id);
      toast.success(`Status do candidato alterado para "${newStatus}".`);
      updateStatus.reset();
      window.location.reload();
    } catch {
      toast.error("Erro ao alterar status do candidato.");
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig["Aguardando Aprovação"];
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getCandidatoStatusBadge = (status: string) => {
    const config = statusCandidatoConfig[status] || statusCandidatoConfig["Em análise"];
    return (
      <Badge variant="outline" className={`gap-1 ${config.className}`}>
        {config.label}
      </Badge>
    );
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

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Aprovação de Vagas
      </h2>

      {!isDiretoria && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
          Você pode visualizar as vagas e seus status, mas apenas membros do grupo <strong>Diretoria</strong> podem aprovar ou reprovar.
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : activeVagas.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            Nenhuma vaga cadastrada.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
               <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Status do Candidato</TableHead>
                  <TableHead className="w-36">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeVagas.map((vaga) => (
                  <TableRow key={vaga.id}>
                    <TableCell className="font-medium">{vaga.nome_candidato}</TableCell>
                    <TableCell>{vaga.cargo}</TableCell>
                    <TableCell>{vaga.centro_custo_nome}</TableCell>
                    <TableCell>{vaga.site_contrato}</TableCell>
                    <TableCell>{new Date(vaga.created_at).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{getCandidatoStatusBadge((vaga as Record<string, unknown>).status_candidato as string || "Em análise")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver detalhes"
                          onClick={() => setDetailVaga(vaga)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {isDiretoria && vaga.status === "Aguardando Aprovação" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Aprovar"
                              onClick={() => handleAprovar(vaga)}
                              className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))]"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Reprovar"
                              onClick={() => openReprovar(vaga)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {canDeleteVaga(vaga) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Excluir vaga"
                            onClick={() => { setDeleteVaga(vaga); setDeleteMotivo(""); }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Vagas Devolvidas pelo SESMT */}
      {devolvidasVagas.length > 0 && (
        <>
          <h3 className="font-heading text-xl font-bold text-foreground mt-8 mb-4">
            Vagas Devolvidas pelo SESMT
          </h3>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidato</TableHead>
                    <TableHead>Cargo / Função</TableHead>
                    <TableHead>Centro de Custo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-36">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devolvidasVagas.map((vaga) => (
                    <TableRow key={vaga.id}>
                      <TableCell className="font-medium">{vaga.nome_candidato}</TableCell>
                      <TableCell>{vaga.cargo}</TableCell>
                      <TableCell>{vaga.centro_custo_nome}</TableCell>
                      <TableCell>{getStatusBadge("Devolvida SESMT")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Ver detalhes"
                            onClick={() => setDetailVaga(vaga)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canDeleteVaga(vaga) && (
                            <Button
                              size="sm"
                              onClick={() => handleReenviar(vaga)}
                            >
                              Reenviar para Aprovação
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
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Vaga</DialogTitle>
          </DialogHeader>
          {detailVaga && (
            <DetailDialogContent
              vaga={detailVaga}
              getStatusBadge={getStatusBadge}
              getCandidatoStatusBadge={getCandidatoStatusBadge}
              beneficiosToString={beneficiosToString}
              handleStatusCandidatoChange={handleStatusCandidatoChange}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Reprovação */}
      <Dialog open={showReprovar} onOpenChange={setShowReprovar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reprovar Vaga</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja reprovar a vaga <strong>{selectedVaga?.cargo}</strong> para{" "}
            <strong>{selectedVaga?.nome_candidato}</strong>?
          </p>
          <Textarea
            placeholder="Observação / Justificativa (opcional)"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReprovar(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReprovar}>
              Confirmar Reprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <Dialog open={!!deleteVaga} onOpenChange={() => setDeleteVaga(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Vaga</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja excluir a vaga <strong>{deleteVaga?.cargo}</strong> para{" "}
            <strong>{deleteVaga?.nome_candidato}</strong>?
          </p>
          <div className="space-y-2">
            <Label>Motivo da Exclusão *</Label>
            <Textarea
              placeholder="Informe o motivo da exclusão"
              value={deleteMotivo}
              onChange={(e) => setDeleteMotivo(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteVaga(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting || !deleteMotivo.trim()}>
              {deleting ? "Excluindo..." : "Confirmar Exclusão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AprovacaoVagas;
