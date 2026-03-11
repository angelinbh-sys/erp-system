import { useState, useRef } from "react";
import { useVagas } from "@/hooks/useVagas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Stethoscope, Upload, X, Send, FileText, Undo2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthContext } from "@/contexts/AuthContext";
import VagaTimeline from "@/components/VagaTimeline";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";
import { CriadoPorInfo } from "@/components/CriadoPorInfo";
import { useAuditLog } from "@/hooks/useAuditLog";
import { HistoricoRegistro } from "@/components/HistoricoRegistro";

function VagaTimelineSection({ vagaId, vaga }: { vagaId: string; vaga: any }) {
  const { data: historico = [] } = useVagaHistorico(vagaId);
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
        onClick={() => setOpen(!open)}
      >
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        Fluxo da Vaga
      </button>
      {open && (
        <div className="mt-3">
          <VagaTimeline vaga={vaga} historico={historico} />
        </div>
      )}
    </div>
  );
}

const AgendamentoASO = () => {
  const { data: vagas = [], isLoading } = useVagas("Aprovada");
  const queryClient = useQueryClient();
  const { profile } = useAuthContext();
  const { logAction } = useAuditLog();

  // Per-vaga local state
  const [localData, setLocalData] = useState<Record<string, { dataAgendamento: string; dataEntrega: string }>>({});
  const [arquivos, setArquivos] = useState<Record<string, File | null>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Devolver dialog
  const [devolverVaga, setDevolverVaga] = useState<any>(null);
  const [motivoDevolucao, setMotivoDevolucao] = useState("");
  const [devolvendo, setDevolvendo] = useState(false);

  const getLocal = (vaga: any) => {
    if (!localData[vaga.id]) {
      return {
        dataAgendamento: vaga.data_agendamento_aso || "",
        dataEntrega: vaga.data_entrega_aso || "",
      };
    }
    return localData[vaga.id];
  };

  const setLocal = (vagaId: string, field: string, value: string) => {
    setLocalData((prev) => ({
      ...prev,
      [vagaId]: {
        ...getLocalById(vagaId),
        [field]: value,
      },
    }));
  };

  const getLocalById = (vagaId: string) => {
    const vaga = vagas.find((v: any) => v.id === vagaId);
    if (localData[vagaId]) return localData[vagaId];
    return {
      dataAgendamento: vaga?.data_agendamento_aso || "",
      dataEntrega: vaga?.data_entrega_aso || "",
    };
  };

  const salvarDatas = async (vaga: any) => {
    const local = getLocal(vaga);
    const { error } = await supabase
      .from("vagas")
      .update({
        data_agendamento_aso: local.dataAgendamento || null,
        data_entrega_aso: local.dataEntrega || null,
      } as any)
      .eq("id", vaga.id);
    if (error) {
      toast.error("Erro ao salvar datas.");
      return;
    }
    await logAction({
      modulo: "SESMT",
      pagina: "Agendamento de ASO",
      acao: "edicao",
      descricao: `Salvou datas do ASO: ${vaga.nome_candidato} (${vaga.cargo})`,
      registro_id: vaga.id,
      registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
    });
    toast.success("Datas salvas com sucesso.");
    queryClient.invalidateQueries({ queryKey: ["vagas"] });
  };

  const uploadArquivo = async (vaga: any) => {
    const arquivo = arquivos[vaga.id];
    if (!arquivo) return;
    setUploading((prev) => ({ ...prev, [vaga.id]: true }));
    const ext = arquivo.name.split(".").pop();
    const path = `${vaga.id}/resultado-aso.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("aso-documentos")
      .upload(path, arquivo, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar arquivo.");
      setUploading((prev) => ({ ...prev, [vaga.id]: false }));
      return;
    }

    const { error: updateError } = await supabase
      .from("vagas")
      .update({
        resultado_aso_nome: arquivo.name,
        resultado_aso_path: path,
      } as any)
      .eq("id", vaga.id);

    if (updateError) {
      toast.error("Erro ao salvar referência do arquivo.");
    } else {
      await logAction({
        modulo: "SESMT",
        pagina: "Agendamento de ASO",
        acao: "edicao",
        descricao: `Anexou resultado do ASO: ${vaga.nome_candidato} (${vaga.cargo}) — ${arquivo.name}`,
        registro_id: vaga.id,
        registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });
      toast.success("Resultado do ASO anexado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
    }
    setArquivos((prev) => ({ ...prev, [vaga.id]: null }));
    setUploading((prev) => ({ ...prev, [vaga.id]: false }));
  };

  const canSendAdmissao = (vaga: any) => {
    const local = getLocal(vaga);
    const hasAgendamento = vaga.data_agendamento_aso || local.dataAgendamento;
    const hasEntrega = vaga.data_entrega_aso || local.dataEntrega;
    const hasResultado = vaga.resultado_aso_path;
    return hasAgendamento && hasEntrega && hasResultado && !vaga.enviado_admissao;
  };

  const enviarAdmissao = async (vaga: any) => {
    const { error } = await supabase
      .from("vagas")
      .update({
        enviado_admissao: true,
        enviado_admissao_at: new Date().toISOString(),
      } as any)
      .eq("id", vaga.id);

    if (error) {
      toast.error("Erro ao enviar para admissão.");
      return;
    }

    await supabase.from("notificacoes").insert({
      titulo: "Candidato liberado para Admissão",
      mensagem: `O candidato ${vaga.nome_candidato} (${vaga.cargo}) foi liberado pelo SESMT para admissão.`,
      tipo: "success",
      link: "/departamento-pessoal/admissao",
      vaga_id: vaga.id,
    });

    // Log history
    await supabase.from("vagas_historico" as any).insert({
      vaga_id: vaga.id,
      acao: "Enviado para Admissão",
      usuario_nome: profile?.nome || "Sistema",
    } as any);

    await logAction({
      modulo: "SESMT",
      pagina: "Agendamento de ASO",
      acao: "envio_etapa",
      descricao: `Enviou para Admissão: ${vaga.nome_candidato} (${vaga.cargo})`,
      registro_id: vaga.id,
      registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
    });

    toast.success("Candidato enviado para Admissão com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["vagas"] });
  };

  const handleDevolver = async () => {
    if (!devolverVaga || !motivoDevolucao.trim()) {
      toast.error("O motivo da devolução é obrigatório.");
      return;
    }
    setDevolvendo(true);
    try {
      const { error } = await supabase
        .from("vagas")
        .update({
          status: "Devolvida SESMT",
          data_agendamento_aso: null,
          data_entrega_aso: null,
          resultado_aso_nome: null,
          resultado_aso_path: null,
        } as any)
        .eq("id", devolverVaga.id);

      if (error) throw error;

      // Log history
      await supabase.from("vagas_historico" as any).insert({
        vaga_id: devolverVaga.id,
        acao: "Devolvida pelo SESMT para RH",
        usuario_nome: profile?.nome || "Sistema",
        motivo: motivoDevolucao.trim(),
      } as any);

      // Notification
      await supabase.from("notificacoes").insert({
        titulo: "Vaga devolvida pelo SESMT",
        mensagem: `A vaga ${devolverVaga.cargo} (${devolverVaga.nome_candidato}) foi devolvida pelo SESMT. Motivo: ${motivoDevolucao.trim()}`,
        tipo: "warning",
        link: "/rh/aprovacao-vagas",
        vaga_id: devolverVaga.id,
      });

      toast.success("Vaga devolvida para o RH com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      setDevolverVaga(null);
      setMotivoDevolucao("");
    } catch {
      toast.error("Erro ao devolver vaga.");
    } finally {
      setDevolvendo(false);
    }
  };

  const getStatusLabel = (vaga: any) => {
    if (vaga.enviado_admissao) return { label: "Liberado para Admissão", className: "bg-blue-100 text-blue-800 border-blue-300" };
    if (vaga.resultado_aso_path) return { label: "Aguardando envio para Admissão", className: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Em processo no SESMT", className: "bg-purple-100 text-purple-800 border-purple-300" };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
        Agendamento de ASO
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Vagas aprovadas pela Diretoria. Preencha os dados do ASO e envie para Admissão quando completo.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : vagas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mb-3 opacity-40" />
              <p>Nenhuma vaga aprovada aguardando processo de ASO.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {vagas.map((vaga: any) => {
            const status = getStatusLabel(vaga);
            const local = getLocal(vaga);
            const arquivo = arquivos[vaga.id] || null;
            const isUploading = uploading[vaga.id] || false;

            return (
              <Card key={vaga.id}>
                <CardContent className="pt-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">{vaga.nome_candidato}</h3>
                      <p className="text-sm text-muted-foreground">{vaga.cargo} — {vaga.centro_custo_nome} — {vaga.site_contrato}</p>
                      <CriadoPorInfo criadoPorId={(vaga as any).criado_por} criadoEm={vaga.created_at} className="mt-1" />
                    </div>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </div>

                  {/* Timeline collapsible */}
                  <VagaTimelineSection vagaId={vaga.id} vaga={vaga} />

                  {vaga.enviado_admissao ? (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                      <p className="text-sm font-medium text-blue-800">
                        ✓ Candidato já liberado para Admissão
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Enviado em {new Date(vaga.enviado_admissao_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Campos ASO inline */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                        <div>
                          <Label>Data de Agendamento do ASO *</Label>
                          <Input
                            type="date"
                            value={local.dataAgendamento}
                            onChange={(e) => setLocal(vaga.id, "dataAgendamento", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Data de Entrega do ASO *</Label>
                          <Input
                            type="date"
                            value={local.dataEntrega}
                            onChange={(e) => setLocal(vaga.id, "dataEntrega", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button size="sm" variant="outline" onClick={() => salvarDatas(vaga)}>
                            Salvar Datas
                          </Button>
                        </div>
                      </div>

                      {/* Upload resultado ASO */}
                      <div className="p-4 bg-muted/30 rounded-lg border border-border">
                        <Label>Resultado do ASO *</Label>
                        {vaga.resultado_aso_nome && (
                          <div className="flex items-center gap-2 mt-1 p-2 bg-background rounded-md border border-border">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{vaga.resultado_aso_nome}</span>
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 ml-auto">
                              Anexado
                            </Badge>
                          </div>
                        )}
                        <div
                          className="mt-2 border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                          onClick={() => fileInputRefs.current[vaga.id]?.click()}
                        >
                          <input
                            ref={(el) => { fileInputRefs.current[vaga.id] = el; }}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => setArquivos((prev) => ({ ...prev, [vaga.id]: e.target.files?.[0] || null }))}
                          />
                          {arquivo ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-medium text-foreground">{arquivo.name}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setArquivos((prev) => ({ ...prev, [vaga.id]: null })); }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1 text-muted-foreground">
                              <Upload className="h-6 w-6" />
                              <span className="text-sm">Clique para anexar (PDF, JPG, PNG)</span>
                            </div>
                          )}
                        </div>
                        {arquivo && (
                          <Button size="sm" className="mt-2" onClick={() => uploadArquivo(vaga)} disabled={isUploading}>
                            {isUploading ? "Enviando..." : "Enviar Arquivo"}
                          </Button>
                        )}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-border">
                        <Button
                          className="flex-1"
                          disabled={!canSendAdmissao(vaga)}
                          onClick={() => enviarAdmissao(vaga)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Enviar para Admissão
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => { setDevolverVaga(vaga); setMotivoDevolucao(""); }}
                        >
                          <Undo2 className="h-4 w-4 mr-2" />
                          Devolver para RH
                        </Button>
                      </div>
                      {!canSendAdmissao(vaga) && (
                        <p className="text-xs text-muted-foreground text-center">
                          Preencha a data de agendamento, data de entrega e anexe o resultado do ASO para liberar o envio.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog Devolver para RH */}
      <Dialog open={!!devolverVaga} onOpenChange={() => setDevolverVaga(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Devolver para RH</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Devolver a vaga <strong>{devolverVaga?.cargo}</strong> do candidato{" "}
            <strong>{devolverVaga?.nome_candidato}</strong> para o RH.
          </p>
          <div className="space-y-2">
            <Label>Motivo da Devolução *</Label>
            <Textarea
              placeholder="Informe o motivo da devolução"
              value={motivoDevolucao}
              onChange={(e) => setMotivoDevolucao(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDevolverVaga(null)}>
              Cancelar
            </Button>
            <Button onClick={handleDevolver} disabled={devolvendo || !motivoDevolucao.trim()}>
              {devolvendo ? "Devolvendo..." : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendamentoASO;
