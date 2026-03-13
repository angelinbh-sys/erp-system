import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useContratos } from "@/hooks/useContratos";
import { useMedicoes } from "@/hooks/useMedicoes";
import { Download } from "lucide-react";

type Relatorio = "medicoes" | "avanco" | "historico";

export default function RelatoriosContratos() {
  const { contratosQuery } = useContratos();
  const { medicoesQuery } = useMedicoes();
  const contratos = contratosQuery.data ?? [];
  const medicoes = medicoesQuery.data ?? [];

  const [tipoRelatorio, setTipoRelatorio] = useState<Relatorio>("medicoes");
  const [filtroContrato, setFiltroContrato] = useState<string>("todos");

  const medicoesFiltradas = useMemo(() => {
    if (filtroContrato === "todos") return medicoes;
    return medicoes.filter((m) => m.contrato_id === filtroContrato);
  }, [medicoes, filtroContrato]);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const fmtDate = (d: string) => d ? new Date(d + "T00:00:00").toLocaleDateString("pt-BR") : "";
  const getContratoNumero = (id: string) => contratos.find((c) => c.id === id)?.numero_contrato ?? "—";

  const avancoData = useMemo(() => {
    return contratos.map((c) => {
      const meds = medicoes.filter((m) => m.contrato_id === c.id);
      const totalMedido = meds.reduce((s, m) => s + Number(m.valor_medido), 0);
      const pct = Number(c.valor_contrato) > 0 ? (totalMedido / Number(c.valor_contrato)) * 100 : 0;
      return { ...c, totalMedido, percentual: pct, qtdMedicoes: meds.length };
    });
  }, [contratos, medicoes]);

  const exportCSV = () => {
    let csv = "";
    if (tipoRelatorio === "medicoes") {
      csv = "Data,Contrato,Descrição,Valor Medido,Observação\n";
      medicoesFiltradas.forEach((m) => {
        csv += `${m.data},${getContratoNumero(m.contrato_id)},"${m.descricao}",${m.valor_medido},"${m.observacao || ""}"\n`;
      });
    } else if (tipoRelatorio === "avanco") {
      csv = "Contrato,Cliente,Valor Contratado,Total Medido,Avanço %\n";
      avancoData.forEach((c) => {
        csv += `${c.numero_contrato},"${c.cliente}",${c.valor_contrato},${c.totalMedido},${c.percentual.toFixed(1)}\n`;
      });
    } else {
      csv = "Data,Contrato,Descrição,Valor Medido,Observação\n";
      medicoesFiltradas.forEach((m) => {
        csv += `${m.data},${getContratoNumero(m.contrato_id)},"${m.descricao}",${m.valor_medido},"${m.observacao || ""}"\n`;
      });
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${tipoRelatorio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Relatórios de Contratos</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo de Relatório</Label>
              <Select value={tipoRelatorio} onValueChange={(v) => setTipoRelatorio(v as Relatorio)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicoes">Medições por Contrato</SelectItem>
                  <SelectItem value="avanco">Avanço Financeiro por Contrato</SelectItem>
                  <SelectItem value="historico">Histórico de Medições</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(tipoRelatorio === "medicoes" || tipoRelatorio === "historico") && (
              <div>
                <Label>Contrato</Label>
                <Select value={filtroContrato} onValueChange={setFiltroContrato}>
                  <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {contratos.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.numero_contrato}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex items-end">
              <Button variant="outline" onClick={exportCSV}>
                <Download className="h-4 w-4 mr-2" />Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {tipoRelatorio === "avanco" ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor Contratado</TableHead>
                  <TableHead>Total Medido</TableHead>
                  <TableHead>Avanço (%)</TableHead>
                  <TableHead>Nº Medições</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {avancoData.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum dado.</TableCell></TableRow>
                ) : avancoData.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.numero_contrato}</TableCell>
                    <TableCell>{c.cliente}</TableCell>
                    <TableCell>{fmt(Number(c.valor_contrato))}</TableCell>
                    <TableCell>{fmt(c.totalMedido)}</TableCell>
                    <TableCell>{c.percentual.toFixed(1)}%</TableCell>
                    <TableCell>{c.qtdMedicoes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor Medido</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {medicoesFiltradas.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma medição encontrada.</TableCell></TableRow>
                ) : medicoesFiltradas.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{fmtDate(m.data)}</TableCell>
                    <TableCell className="font-medium">{getContratoNumero(m.contrato_id)}</TableCell>
                    <TableCell>{m.descricao}</TableCell>
                    <TableCell>{fmt(Number(m.valor_medido))}</TableCell>
                    <TableCell className="text-muted-foreground">{m.observacao ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
