import { useVagas } from "@/hooks/useVagas";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Eye, Lock, Unlock, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const Admissao = () => {
  const { data: allVagas = [], isLoading } = useVagas("Aprovada");
  const queryClient = useQueryClient();
  const [detailVaga, setDetailVaga] = useState<any>(null);

  // DP sees all approved vagas
  const vagas = allVagas;

  const getStatusLabel = (vaga: any) => {
    if (vaga.enviado_admissao) return { label: "Liberado para Admissão", className: "bg-green-100 text-green-800 border-green-300", icon: <Unlock className="h-3 w-3" /> };
    return { label: "Aguardando SESMT", className: "bg-amber-100 text-amber-800 border-amber-300", icon: <Lock className="h-3 w-3" /> };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-2">
        Admissão de Candidatos
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        Candidatos aprovados pela Diretoria. Visualize os dados e aguarde a liberação do SESMT para dar continuidade à admissão.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : vagas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mb-3 opacity-40" />
              <p>Nenhum candidato aprovado no momento.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
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
                      <TableCell className="font-medium">{vaga.nome_candidato}</TableCell>
                      <TableCell>{vaga.cargo}</TableCell>
                      <TableCell>{vaga.centro_custo_nome}</TableCell>
                      <TableCell>{vaga.site_contrato}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 ${status.className}`}>
                          {status.icon}
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setDetailVaga(vaga)} title="Ver detalhes">
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

      {/* Dialog de Detalhes */}
      <Dialog open={!!detailVaga} onOpenChange={() => setDetailVaga(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Candidato</DialogTitle>
          </DialogHeader>
          {detailVaga && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><strong>Nome:</strong> {detailVaga.nome_candidato}</div>
                <div><strong>Cargo:</strong> {detailVaga.cargo}</div>
                <div><strong>Salário:</strong> {detailVaga.salario}</div>
                <div><strong>Centro de Custo:</strong> {detailVaga.centro_custo_nome}</div>
                <div><strong>Site / Contrato:</strong> {detailVaga.site_contrato}</div>
                <div><strong>Local de Trabalho:</strong> {detailVaga.local_trabalho}</div>
                <div><strong>Data de Nascimento:</strong> {detailVaga.data_nascimento}</div>
                <div><strong>Telefone:</strong> {detailVaga.telefone}</div>
              </div>

              {detailVaga.enviado_admissao ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-medium text-green-800 flex items-center gap-2">
                    <Unlock className="h-4 w-4" />
                    Liberado pelo SESMT para Admissão
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Liberado em {detailVaga.enviado_admissao_at ? new Date(detailVaga.enviado_admissao_at).toLocaleDateString("pt-BR") : "—"}
                  </p>
                  {detailVaga.data_agendamento_aso && (
                    <p className="text-xs text-muted-foreground mt-2">
                      ASO agendado: {detailVaga.data_agendamento_aso} | Entrega: {detailVaga.data_entrega_aso || "—"}
                    </p>
                  )}
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 p-3 bg-muted/50 rounded-md">
                      <p className="text-sm text-muted-foreground italic">
                        Campos de admissão serão definidos posteriormente.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("vagas")
                          .update({ enviado_admissao: false, enviado_admissao_at: null } as any)
                          .eq("id", detailVaga.id);
                        if (error) { toast.error("Erro ao devolver."); return; }
                        toast.success("Devolvido para o SESMT.");
                        queryClient.invalidateQueries({ queryKey: ["vagas"] });
                        setDetailVaga(null);
                      }}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Devolver para SESMT
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Aguardando liberação do SESMT
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    O processo de admissão será liberado após o SESMT concluir o agendamento e envio do ASO.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admissao;
