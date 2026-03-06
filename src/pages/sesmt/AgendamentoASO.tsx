import { useState, useRef } from "react";
import { useVagas } from "@/hooks/useVagas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Stethoscope, Upload, X, Send, Eye, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const AgendamentoASO = () => {
  const { data: vagas = [], isLoading } = useVagas("Aprovada");
  const queryClient = useQueryClient();

  const [selectedVaga, setSelectedVaga] = useState<any>(null);
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [dataEntrega, setDataEntrega] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openDialog = (vaga: any) => {
    setSelectedVaga(vaga);
    setDataAgendamento(vaga.data_agendamento_aso || "");
    setDataEntrega(vaga.data_entrega_aso || "");
    setArquivo(null);
  };

  const closeDialog = () => {
    setSelectedVaga(null);
    setDataAgendamento("");
    setDataEntrega("");
    setArquivo(null);
  };

  const salvarDatas = async () => {
    if (!selectedVaga) return;
    const { error } = await supabase
      .from("vagas")
      .update({
        data_agendamento_aso: dataAgendamento || null,
        data_entrega_aso: dataEntrega || null,
      } as any)
      .eq("id", selectedVaga.id);
    if (error) {
      toast.error("Erro ao salvar datas.");
      return;
    }
    toast.success("Datas salvas com sucesso.");
    queryClient.invalidateQueries({ queryKey: ["vagas"] });
    // Update local state
    setSelectedVaga({ ...selectedVaga, data_agendamento_aso: dataAgendamento, data_entrega_aso: dataEntrega });
  };

  const uploadArquivo = async () => {
    if (!arquivo || !selectedVaga) return;
    setUploading(true);
    const ext = arquivo.name.split(".").pop();
    const path = `${selectedVaga.id}/resultado-aso.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from("aso-documentos")
      .upload(path, arquivo, { upsert: true });

    if (uploadError) {
      toast.error("Erro ao enviar arquivo.");
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("vagas")
      .update({
        resultado_aso_nome: arquivo.name,
        resultado_aso_path: path,
      } as any)
      .eq("id", selectedVaga.id);

    if (updateError) {
      toast.error("Erro ao salvar referência do arquivo.");
    } else {
      toast.success("Resultado do ASO anexado com sucesso.");
      setSelectedVaga({ ...selectedVaga, resultado_aso_nome: arquivo.name, resultado_aso_path: path });
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
    }
    setArquivo(null);
    setUploading(false);
  };

  const enviarAdmissao = async () => {
    if (!selectedVaga) return;
    const { error } = await supabase
      .from("vagas")
      .update({
        enviado_admissao: true,
        enviado_admissao_at: new Date().toISOString(),
      } as any)
      .eq("id", selectedVaga.id);

    if (error) {
      toast.error("Erro ao enviar para admissão.");
      return;
    }

    // Create notification
    await supabase.from("notificacoes").insert({
      titulo: "Candidato liberado para Admissão",
      mensagem: `O candidato ${selectedVaga.nome_candidato} (${selectedVaga.cargo}) foi liberado pelo SESMT para admissão.`,
      tipo: "success",
      link: "/departamento-pessoal/admissao",
      vaga_id: selectedVaga.id,
    });

    toast.success("Candidato enviado para Admissão com sucesso!");
    queryClient.invalidateQueries({ queryKey: ["vagas"] });
    closeDialog();
  };

  const canSendAdmissao = (vaga: any) => {
    const hasAgendamento = vaga?.data_agendamento_aso || dataAgendamento;
    const hasEntrega = vaga?.data_entrega_aso || dataEntrega;
    const hasResultado = vaga?.resultado_aso_path;
    return hasAgendamento && hasEntrega && hasResultado && !vaga?.enviado_admissao;
  };

  const getStatusLabel = (vaga: any) => {
    if (vaga.enviado_admissao) return { label: "Liberado para Admissão", className: "bg-blue-100 text-blue-800 border-blue-300" };
    if (vaga.resultado_aso_path) return { label: "Aguardando envio para Admissão", className: "bg-amber-100 text-amber-800 border-amber-300" };
    return { label: "Em processo no SESMT", className: "bg-purple-100 text-purple-800 border-purple-300" };
  };

  // Filter: show approved vagas that haven't been sent to admissão yet, plus those in process
  const vagasSESMT = vagas;

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
      ) : vagasSESMT.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mb-3 opacity-40" />
              <p>Nenhuma vaga aprovada aguardando processo de ASO.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead>Status do Processo</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasSESMT.map((vaga: any) => {
                  const status = getStatusLabel(vaga);
                  return (
                    <TableRow key={vaga.id}>
                      <TableCell className="font-medium">{vaga.cargo}</TableCell>
                      <TableCell>{vaga.nome_candidato}</TableCell>
                      <TableCell>{vaga.centro_custo_nome}</TableCell>
                      <TableCell>{vaga.site_contrato}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => openDialog(vaga)} title="Gerenciar ASO">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Gerenciamento ASO */}
      <Dialog open={!!selectedVaga} onOpenChange={() => closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Gerenciar ASO — {selectedVaga?.nome_candidato}
            </DialogTitle>
          </DialogHeader>

          {selectedVaga && (
            <div className="space-y-4">
              {/* Info do candidato */}
              <div className="grid grid-cols-2 gap-2 text-sm bg-muted/50 rounded-lg p-3">
                <div><strong>Cargo:</strong> {selectedVaga.cargo}</div>
                <div><strong>Centro de Custo:</strong> {selectedVaga.centro_custo_nome}</div>
                <div><strong>Site / Contrato:</strong> {selectedVaga.site_contrato}</div>
                <div><strong>Telefone:</strong> {selectedVaga.telefone}</div>
              </div>

              {selectedVaga.enviado_admissao ? (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
                  <p className="text-sm font-medium text-blue-800">
                    ✓ Candidato já liberado para Admissão
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Enviado em {new Date(selectedVaga.enviado_admissao_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ) : (
                <>
                  {/* Datas */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Data de Agendamento do ASO *</Label>
                      <Input
                        type="date"
                        value={dataAgendamento}
                        onChange={(e) => setDataAgendamento(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Data de Entrega do ASO *</Label>
                      <Input
                        type="date"
                        value={dataEntrega}
                        onChange={(e) => setDataEntrega(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button size="sm" variant="outline" onClick={salvarDatas}>
                      Salvar Datas
                    </Button>
                  </div>

                  {/* Upload resultado ASO */}
                  <div>
                    <Label>Resultado do ASO *</Label>
                    {selectedVaga.resultado_aso_nome ? (
                      <div className="flex items-center gap-2 mt-1 p-2 bg-muted/50 rounded-md">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{selectedVaga.resultado_aso_nome}</span>
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 ml-auto">
                          Anexado
                        </Badge>
                      </div>
                    ) : null}
                    <div
                      className="mt-2 border-2 border-dashed border-input rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                      />
                      {arquivo ? (
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-sm font-medium text-foreground">{arquivo.name}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setArquivo(null); }}
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
                      <Button size="sm" className="mt-2" onClick={uploadArquivo} disabled={uploading}>
                        {uploading ? "Enviando..." : "Enviar Arquivo"}
                      </Button>
                    )}
                  </div>

                  {/* Botão Enviar para Admissão */}
                  <div className="pt-3 border-t border-border">
                    <Button
                      className="w-full"
                      disabled={!canSendAdmissao(selectedVaga)}
                      onClick={enviarAdmissao}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Admissão
                    </Button>
                    {!canSendAdmissao(selectedVaga) && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Preencha a data de agendamento, data de entrega e anexe o resultado do ASO para liberar.
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgendamentoASO;
