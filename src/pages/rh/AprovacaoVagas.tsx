import { useState } from "react";
import { toast } from "sonner";
import { Check, X, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";

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
};

const statusCandidatoConfig: Record<string, { label: string; className: string }> = {
  "Em análise": { label: "Em análise", className: "bg-blue-100 text-blue-800 border-blue-300" },
  "Aprovado": { label: "Aprovado", className: "bg-green-100 text-green-800 border-green-300" },
  "Reprovado": { label: "Reprovado", className: "bg-red-100 text-red-800 border-red-300" },
};

const AprovacaoVagas = () => {
  const { data: vagas = [], isLoading } = useVagas();
  const updateStatus = useUpdateVagaStatus();
  const createNotificacao = useCreateNotificacao();
  const { profile } = useAuthContext();

  const isDiretoria = profile?.grupo_permissao?.toLowerCase() === "diretoria";

  const [selectedVaga, setSelectedVaga] = useState<Vaga | null>(null);
  const [showReprovar, setShowReprovar] = useState(false);
  const [observacao, setObservacao] = useState("");
  const [detailVaga, setDetailVaga] = useState<Vaga | null>(null);

  const handleAprovar = async (vaga: Vaga) => {
    try {
      await updateStatus.mutateAsync({ id: vaga.id, status: "Aprovada" });
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
      // Refetch
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
      ) : vagas.length === 0 ? (
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
                {vagas.map((vaga) => (
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
                              className="text-green-600 hover:text-green-700"
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
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Detalhes */}
      <Dialog open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes da Vaga</DialogTitle>
          </DialogHeader>
          {detailVaga && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Cargo:</strong> {detailVaga.cargo}</div>
                <div><strong>Salário:</strong> {detailVaga.salario}</div>
                <div><strong>Centro de Custo:</strong> {detailVaga.centro_custo_nome}</div>
                <div><strong>Site / Contrato:</strong> {detailVaga.site_contrato}</div>
                <div><strong>Local:</strong> {detailVaga.local_trabalho}</div>
                <div><strong>Candidato:</strong> {detailVaga.nome_candidato}</div>
                <div><strong>Nascimento:</strong> {detailVaga.data_nascimento}</div>
                <div><strong>Telefone:</strong> {detailVaga.telefone}</div>
              </div>
              <div><strong>Benefícios:</strong> {beneficiosToString(detailVaga.beneficios)}</div>
              <div><strong>Status da Vaga:</strong> {getStatusBadge(detailVaga.status)}</div>
              <div><strong>Status do Candidato:</strong> {getCandidatoStatusBadge((detailVaga as Record<string, unknown>).status_candidato as string || "Em análise")}</div>
              {detailVaga.observacao_reprovacao && (
                <div><strong>Motivo da reprovação:</strong> {detailVaga.observacao_reprovacao}</div>
              )}

              {/* Status do Candidato - editable */}
              <div className="pt-3 border-t border-border">
                <Label className="text-sm font-semibold">Alterar Status do Candidato</Label>
                <Select
                  value={(detailVaga as Record<string, unknown>).status_candidato as string || "Em análise"}
                  onValueChange={(v) => handleStatusCandidatoChange(detailVaga, v)}
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
    </div>
  );
};

export default AprovacaoVagas;
