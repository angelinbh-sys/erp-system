import { useVagas } from "@/hooks/useVagas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ClipboardList, Eye, Lock, Unlock, Undo2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import VagaTimeline from "@/components/VagaTimeline";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";
import { CriadoPorInfo } from "@/components/CriadoPorInfo";
import { useAuditLog } from "@/hooks/useAuditLog";
import { HistoricoRegistro } from "@/components/HistoricoRegistro";
import { useAuthContext } from "@/contexts/AuthContext";
import { STATUS_PROCESSO } from "@/utils/statusProcesso";

function AdmissaoDetailDialog({ detailVaga, setDetailVaga, queryClient, logAction, profile }: { detailVaga: any; setDetailVaga: (v: any) => void; queryClient: any; logAction: any; profile: any }) {
  const { data: historico = [] } = useVagaHistorico(detailVaga?.id || null);
  const sp = detailVaga?.status_processo;
  const isAdmitido = sp === STATUS_PROCESSO.ADMITIDO || sp === STATUS_PROCESSO.EFETIVADO;

  const handleConcluirAdmissao = async () => {
    try {
      // Update vaga status
      const { error } = await supabase.from("vagas").update({
        status_processo: STATUS_PROCESSO.ADMITIDO,
        responsavel_etapa: "Dep. Pessoal",
      } as any).eq("id", detailVaga.id);
      if (error) throw error;

      // Create colaborador automatically
      const { error: colabError } = await supabase.from("colaboradores").insert({
        nome: detailVaga.nome_candidato,
        cargo: detailVaga.cargo,
        centro_custo: detailVaga.centro_custo_nome,
        site_contrato: detailVaga.site_contrato,
        data_nascimento: detailVaga.data_nascimento || null,
        telefone: detailVaga.telefone || null,
        vaga_id: detailVaga.id,
        status: "Ativo",
      });
      if (colabError) console.error("Erro ao criar colaborador:", colabError);

      await supabase.from("vagas_historico" as any).insert({
        vaga_id: detailVaga.id, acao: "Admissão concluída", usuario_nome: profile?.nome || "Sistema",
      } as any);

      await logAction({
        modulo: "Dep. Pessoal", pagina: "Admissão", acao: "conclusao_admissao",
        descricao: `Concluiu admissão: ${detailVaga.nome_candidato} (${detailVaga.cargo})`,
        registro_id: detailVaga.id, registro_ref: `${detailVaga.cargo} - ${detailVaga.nome_candidato}`,
      });

      toast.success("Admissão concluída! Colaborador enviado para o Efetivo.");
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      setDetailVaga(null);
    } catch {
      toast.error("Erro ao concluir admissão.");
    }
  };

  return (
    <Dialog open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Detalhes do Candidato</DialogTitle></DialogHeader>
        {detailVaga && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              {detailVaga.numero_vaga && <div className="col-span-2"><strong>Número da Vaga:</strong> <span className="font-mono text-primary">{detailVaga.numero_vaga}</span></div>}
              <div><strong>Nome:</strong> {detailVaga.nome_candidato}</div>
              <div><strong>Cargo:</strong> {detailVaga.cargo}</div>
              <div><strong>Salário:</strong> {detailVaga.salario}</div>
              <div><strong>Centro de Custo:</strong> {detailVaga.centro_custo_nome}</div>
              <div><strong>Site / Contrato:</strong> {detailVaga.site_contrato}</div>
              <div><strong>Local de Trabalho:</strong> {detailVaga.local_trabalho}</div>
              <div><strong>Data de Nascimento:</strong> {detailVaga.data_nascimento}</div>
              <div><strong>Telefone:</strong> {detailVaga.telefone}</div>
            </div>
            <CriadoPorInfo criadoPorId={detailVaga.criado_por} criadoEm={detailVaga.created_at} className="mt-2" />

            <div className="pt-3 border-t border-border">
              <VagaTimeline vaga={detailVaga} historico={historico} />
            </div>
            <div className="pt-3 border-t border-border">
              <HistoricoRegistro registroId={detailVaga.id} />
            </div>

            {isAdmitido ? (
              <div className="rounded-lg bg-teal-50 border border-teal-200 p-4">
                <p className="text-sm font-medium text-teal-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />Admissão concluída — Colaborador no Efetivo
                </p>
              </div>
            ) : detailVaga.enviado_admissao ? (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                  <Unlock className="h-4 w-4" />Liberado pelo SESMT para Admissão
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Liberado em {detailVaga.enviado_admissao_at ? new Date(detailVaga.enviado_admissao_at).toLocaleDateString("pt-BR") : "—"}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button onClick={handleConcluirAdmissao}>
                    <CheckCircle2 className="h-4 w-4 mr-1" />Concluir Admissão
                  </Button>
                  <Button variant="outline" size="sm"
                    onClick={async () => {
                      const { error } = await supabase.from("vagas").update({
                        enviado_admissao: false, enviado_admissao_at: null,
                        status_processo: STATUS_PROCESSO.EM_ANDAMENTO_SESMT, responsavel_etapa: "SESMT",
                      } as any).eq("id", detailVaga.id);
                      if (error) { toast.error("Erro ao devolver."); return; }
                      await logAction({ modulo: "Dep. Pessoal", pagina: "Admissão", acao: "devolucao", descricao: `Devolveu para SESMT: ${detailVaga.cargo} — ${detailVaga.nome_candidato}`, registro_id: detailVaga.id, registro_ref: `${detailVaga.cargo} - ${detailVaga.nome_candidato}` });
                      toast.success("Devolvido para o SESMT.");
                      queryClient.invalidateQueries({ queryKey: ["vagas"] });
                      setDetailVaga(null);
                    }}
                  >
                    <Undo2 className="h-4 w-4 mr-1" />Devolver para SESMT
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  <Lock className="h-4 w-4" />Aguardando liberação do SESMT
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

const Admissao = () => {
  const { data: allVagas = [], isLoading } = useVagas("Aprovada");
  const queryClient = useQueryClient();
  const [detailVaga, setDetailVaga] = useState<any>(null);
  const { logAction } = useAuditLog();
  const { profile } = useAuthContext();

  const vagas = allVagas.filter((v: any) => v.status_processo !== STATUS_PROCESSO.ADMITIDO && v.status_processo !== STATUS_PROCESSO.EFETIVADO);

  const getStatusLabel = (vaga: any) => {
    const sp = vaga.status_processo;
    if (sp === STATUS_PROCESSO.ADMITIDO) return { label: "Admitido", className: "bg-teal-100 text-teal-800 border-teal-300", icon: <CheckCircle2 className="h-3 w-3" /> };
    if (vaga.enviado_admissao) return { label: "Liberado para Admissão", className: "bg-green-100 text-green-800 border-green-300", icon: <Unlock className="h-3 w-3" /> };
    return { label: "Aguardando SESMT", className: "bg-amber-100 text-amber-800 border-amber-300", icon: <Lock className="h-3 w-3" /> };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Admissão de Candidatos</h2>
      <p className="text-sm text-muted-foreground mb-6">Candidatos aprovados pela Diretoria. Visualize os dados e aguarde a liberação do SESMT para dar continuidade à admissão.</p>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : vagas.length === 0 ? (
        <Card><CardContent className="pt-6"><div className="flex flex-col items-center justify-center py-8 text-muted-foreground"><ClipboardList className="h-12 w-12 mb-3 opacity-40" /><p>Nenhum candidato aprovado no momento.</p></div></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagas.map((vaga: any) => {
                  const status = getStatusLabel(vaga);
                  return (
                    <TableRow key={vaga.id}>
                      <TableCell className="font-mono text-xs text-primary">{vaga.numero_vaga || "—"}</TableCell>
                      <TableCell className="font-medium">{vaga.nome_candidato}</TableCell>
                      <TableCell>{vaga.cargo}</TableCell>
                      <TableCell>{vaga.centro_custo_nome}</TableCell>
                      <TableCell>{vaga.site_contrato}</TableCell>
                      <TableCell><Badge variant="outline" className={`gap-1 ${status.className}`}>{status.icon}{status.label}</Badge></TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setDetailVaga(vaga)} title="Ver detalhes"><Eye className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <AdmissaoDetailDialog detailVaga={detailVaga} setDetailVaga={setDetailVaga} queryClient={queryClient} logAction={logAction} profile={profile} />
    </div>
  );
};

export default Admissao;
