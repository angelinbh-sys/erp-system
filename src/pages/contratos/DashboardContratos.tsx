import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useContratos } from "@/hooks/useContratos";
import { useMedicoes } from "@/hooks/useMedicoes";
import { DollarSign, BarChart3, Wallet, TrendingUp } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Cell, Tooltip } from "recharts";

// Distinct colors for better differentiation in charts
const PROJECT_COLORS = [
  "hsl(220, 70%, 50%)",  // azul
  "hsl(340, 65%, 50%)",  // rosa/vermelho
  "hsl(160, 60%, 40%)",  // verde
  "hsl(35, 85%, 55%)",   // laranja
  "hsl(270, 55%, 55%)",  // roxo
  "hsl(185, 65%, 42%)",  // ciano/teal
  "hsl(50, 80%, 48%)",   // amarelo
  "hsl(0, 65%, 50%)",    // vermelho
  "hsl(140, 50%, 35%)",  // verde escuro
  "hsl(300, 45%, 50%)",  // magenta
];

export default function DashboardContratos() {
  const { contratosQuery } = useContratos();
  const { medicoesQuery } = useMedicoes();
  const contratos = contratosQuery.data ?? [];
  const medicoes = medicoesQuery.data ?? [];

  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroProjeto, setFiltroProjeto] = useState<string>("todos");
  const [filtroPeriodoDe, setFiltroPeriodoDe] = useState("");
  const [filtroPeriodoAte, setFiltroPeriodoAte] = useState("");

  const clientes = useMemo(() => [...new Set(contratos.map((c) => c.cliente))], [contratos]);
  const projetos = useMemo(() => [...new Set(contratos.map((c) => c.projeto_obra))], [contratos]);

  const contratosFiltrados = useMemo(() => {
    return contratos.filter((c) => {
      if (filtroCliente !== "todos" && c.cliente !== filtroCliente) return false;
      if (filtroProjeto !== "todos" && c.projeto_obra !== filtroProjeto) return false;
      return true;
    });
  }, [contratos, filtroCliente, filtroProjeto]);

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

  const dadosPizza = useMemo(() => {
    return contratosFiltrados.map((c, i) => ({
      name: c.projeto_obra,
      value: Number(c.valor_contrato),
      color: PROJECT_COLORS[i % PROJECT_COLORS.length],
    }));
  }, [contratosFiltrados]);

  const [modoMedido, setModoMedido] = useState<"valor" | "pct_total" | "pct_projeto">("valor");

  const valorContratadoPorProjeto = useMemo(() => {
    const map: Record<string, number> = {};
    contratosFiltrados.forEach((c) => {
      map[c.projeto_obra] = (map[c.projeto_obra] || 0) + Number(c.valor_contrato);
    });
    return map;
  }, [contratosFiltrados]);

  const dadosPizzaMedido = useMemo(() => {
    const mapa: Record<string, number> = {};
    medicoesFiltradas.forEach((m) => {
      const projeto = contratoMap[m.contrato_id] || "Outros";
      mapa[projeto] = (mapa[projeto] || 0) + Number(m.valor_medido);
    });
    return Object.entries(mapa)
      .map(([name, value], i) => ({
        name,
        value,
        color: PROJECT_COLORS[i % PROJECT_COLORS.length],
      }))
      .filter((d) => d.value > 0);
  }, [medicoesFiltradas, contratoMap]);

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard de Contratos</h1>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="text-2xl font-bold text-foreground">
              {(Math.floor(percentualAvanco * 100) / 100).toFixed(2)}%
            </div>
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
                      formatter={(value, name) => (
                        <span>
                          <strong>{String(name)}</strong>:{" "}
                          {Number(value).toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })}
                        </span>
                      )}
                    />
                  }
                />
                {projetosFiltrados.map((projeto, i) => (
                  <Bar
                    key={projeto}
                    dataKey={projeto}
                    stackId="a"
                    fill={PROJECT_COLORS[i % PROJECT_COLORS.length]}
                    radius={i === projetosFiltrados.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
                <Legend />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valor de Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            {dadosPizza.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhum projeto encontrado.</p>
            ) : (
              <div className="flex items-center justify-center">
                <PieChart width={500} height={350}>
                  <Pie
                    data={dadosPizza}
                    cx={250}
                    cy={175}
                    outerRadius={120}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                    strokeWidth={0}
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(1)}%`}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  >
                    {dadosPizza.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                      name,
                    ]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(225, 15%, 90%)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Projetos — Valor Medido</CardTitle>
            <Select value={modoMedido} onValueChange={(v) => setModoMedido(v as "valor" | "pct_total" | "pct_projeto")}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="valor">Valor (R$)</SelectItem>
                <SelectItem value="pct_total">% do contrato total</SelectItem>
                <SelectItem value="pct_projeto">% do contrato do projeto</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {dadosPizzaMedido.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">Nenhuma medição encontrada.</p>
            ) : (
              <div className="flex items-center justify-center">
                <PieChart width={500} height={350}>
                  <Pie
                    data={dadosPizzaMedido}
                    cx={250}
                    cy={175}
                    outerRadius={120}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                    strokeWidth={0}
                    label={({ name, value, percent }) => {
                      if (modoMedido === "pct_total") {
                        const pct = valorTotalContratado > 0 ? ((value as number) / valorTotalContratado * 100).toFixed(1) : "0.0";
                        return `${name}\n${pct}% do total`;
                      }
                      if (modoMedido === "pct_projeto") {
                        const contrato = valorContratadoPorProjeto[name] || 0;
                        const pct = contrato > 0 ? ((value as number) / contrato * 100).toFixed(1) : "0.0";
                        return `${name}\n${pct}% do projeto`;
                      }
                      return `${name}\n${((percent ?? 0) * 100).toFixed(1)}%`;
                    }}
                    labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  >
                    {dadosPizzaMedido.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const valFmt = value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
                      if (modoMedido === "pct_total") {
                        const pct = valorTotalContratado > 0 ? (value / valorTotalContratado * 100).toFixed(1) : "0.0";
                        return [`${valFmt} (${pct}% do total)`, name];
                      }
                      if (modoMedido === "pct_projeto") {
                        const contrato = valorContratadoPorProjeto[name] || 0;
                        const pct = contrato > 0 ? (value / contrato * 100).toFixed(1) : "0.0";
                        return [`${valFmt} (${pct}% do projeto)`, name];
                      }
                      return [valFmt, name];
                    }}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(225, 15%, 90%)",
                      fontSize: "12px",
                    }}
                  />
                </PieChart>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
