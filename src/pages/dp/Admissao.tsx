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
import VagaTimeline from "@/components/VagaTimeline";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";

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
      <AdmissaoDetailDialog detailVaga={detailVaga} setDetailVaga={setDetailVaga} queryClient={queryClient} />
    </div>
  );
};

export default Admissao;
