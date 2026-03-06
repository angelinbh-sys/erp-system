import { useVagas } from "@/hooks/useVagas";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Stethoscope } from "lucide-react";

const AgendamentoASO = () => {
  const { data: vagas = [], isLoading } = useVagas("Aprovada");

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Agendamento de ASO
      </h2>

      <p className="text-sm text-muted-foreground mb-6">
        Vagas aprovadas pela Diretoria que aguardam agendamento do Atestado de Saúde Ocupacional (ASO).
      </p>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : vagas.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Stethoscope className="h-12 w-12 mb-3 opacity-40" />
              <p>Nenhuma vaga aprovada aguardando agendamento de ASO.</p>
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
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagas.map((vaga) => (
                  <TableRow key={vaga.id}>
                    <TableCell className="font-medium">{vaga.cargo}</TableCell>
                    <TableCell>{vaga.nome_candidato}</TableCell>
                    <TableCell>{vaga.centro_custo_nome}</TableCell>
                    <TableCell>{vaga.site_contrato}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                        Aprovada — Aguardando ASO
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AgendamentoASO;
