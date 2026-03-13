import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useContratos } from "@/hooks/useContratos";
import { useMedicoes } from "@/hooks/useMedicoes";
import { DollarSign, TrendingUp, BarChart3, Wallet } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

const PROJECT_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(270, 70%, 60%)",
  "hsl(190, 80%, 45%)",
  "hsl(330, 70%, 55%)",
  "hsl(60, 70%, 45%)",
  "hsl(200, 60%, 50%)",
  "hsl(15, 80%, 55%)",
];

export default function DashboardContratos() {
  const { contratosQuery } = useContratos();
  const { medicoesQuery } = useMedicoes();
  const contratos = contratosQuery.data ?? [];
  const medicoes = medicoesQuery.data ?? [];

  const [filtroContrato, setFiltroContrato] = useState<string>("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroProjeto, setFiltroProjeto] = useState<string>("todos");
  const [filtroPeriodoDe, setFiltroPeriodoDe] = useState("");
  const [filtroPeriodoAte, setFiltroPeriodoAte] = useState("");

  const clientes = useMemo(() => [...new Set(contratos.map((c) => c.cliente))], [contratos]);
  const projetos = useMemo(() => [...new Set(contratos.map((c) => c.projeto_obra))], [contratos]);

  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroContrato !== "todos" && c.id !== filtroContrato) return false;
      if (filtroCliente !== "todos" && c.cliente !== filtroCliente) return false;
      if (filtroProjeto !== "todos" && c.projeto_obra !== filtroProjeto) return false;
      return true;
    });
  }, [contratos, filtroContrato, filtroCliente, filtroProjeto]);

  const contratoIds = useMemo(() => new Set(contratosFiltrados.map((c) => c.id)), [contratosFiltrados]);

  const medicoesFiltradas = useMemo(() => {
    return medicoes.filter((m) => {
      if (!contratoIds.has(m.contrato_id)) return false;
      if (filtroPeriodoDe && m.data_inicio < filtroPeriodoDe) return false;
      if (filtroPeriodoAte && m.data_fim > filtroPeriodoAte) return false;
      return true;
    });
  }, [medicoes, contratoIds, filtroPeriodoDe, filtroPeriodoAte]);

  const valorTotalContratado = contratosFiltrados.reduce((s, c) => s + Number(c.valor_contrato), 0);
  const valorTotalMedido = medicoesFiltradas.reduce((s, m) => s + Number(m.valor_medido), 0);
  const percentualAvanco = valorTotalContratado > 0 ? (valorTotalMedido / valorTotalContratado) * 100 : 0;
  const valorRestante = valorTotalContratado - valorTotalMedido;

  const contratoMap = useMemo(() => {
    const map: Record<string, string> = {};
    contratos.forEach((c) => { map[c.id] = c.projeto_obra; });
    return map;
  }, [contratos]);

  const projetosFiltrados = useMemo(() => {
    return [...new Set(contratosFiltrados.map((c) => c.projeto_obra))].sort();
  }, [contratosFiltrados]);

  const chartConfig: ChartConfig = useMemo(() => {
    const cfg: ChartConfig = {};
    projetosFiltrados.forEach((p, i) => {
      cfg[p] = { label: p, color: PROJECT_COLORS[i % PROJECT_COLORS.length] };
    });
    return cfg;
  }, [projetosFiltrados]);

  const dadosGrafico = useMemo(() => {
    const mapa: Record<string, Record<string, number>> = {};
    medicoesFiltradas.forEach((m) => {
      const mes = m.data_inicio.substring(0, 7);
      const projeto = contratoMap[m.contrato_id] || "Outros";
      if (!mapa[mes]) mapa[mes] = {};
      mapa[mes][projeto] = (mapa[mes][projeto] || 0) + Number(m.valor_medido);
    });
    return Object.entries(mapa)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, projetos]) => ({
        mes: mes.split("-").reverse().join("/"),
        ...projetos,
      }));
  }, [medicoesFiltradas, contratoMap]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard de Contratos</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <div>
              <Label>Cliente</Label>
              <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Projeto / Obra</Label>
              <Select value={filtroProjeto} onValueChange={setFiltroProjeto}>
                <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {projetos.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Período de</Label>
              <Input type="date" value={filtroPeriodoDe} onChange={(e) => setFiltroPeriodoDe(e.target.value)} />
            </div>
            <div>
              <Label>Período até</Label>
              <Input type="date" value={filtroPeriodoAte} onChange={(e) => setFiltroPeriodoAte(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total Contratado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(valorTotalContratado)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Já Medido</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(valorTotalMedido)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avanço Financeiro</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{percentualAvanco.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Restante</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{fmt(valorRestante)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Avanço Financeiro Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {dadosGrafico.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma medição registrada para o período.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : v.toString()
                  }
                  className="text-xs"
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value) =>
                        Number(value).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      }
                    />
                  }
                />
                <Bar dataKey="valor" fill="var(--color-valor)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
