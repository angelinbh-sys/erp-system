import React, { useState, useMemo, useCallback, useEffect, Component, type ReactNode, type ErrorInfo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useContratos } from "@/hooks/useContratos";
import { useMedicoes } from "@/hooks/useMedicoes";
import { DollarSign, BarChart3, Wallet, TrendingUp } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend as RechartsLegend,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";
import { useIsMobile } from "@/hooks/use-mobile";

class ChartErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Chart render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
          Erro ao renderizar o gráfico. Tente recarregar a página.
        </div>
      );
    }
    return this.props.children;
  }
}

const CHART_PALETTE = [
  "hsl(225, 55%, 48%)",
  "hsl(35, 85%, 52%)",
  "hsl(160, 55%, 40%)",
  "hsl(340, 55%, 50%)",
  "hsl(270, 50%, 55%)",
  "hsl(185, 60%, 42%)",
  "hsl(50, 75%, 50%)",
  "hsl(5, 60%, 50%)",
  "hsl(140, 45%, 35%)",
  "hsl(300, 40%, 50%)",
];

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtCompact = (v: number) =>
  v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1_000
    ? `${(v / 1_000).toFixed(0)}k`
    : v.toString();

const sanitizeSelectOptions = (values: Array<string | null | undefined>) =>
  [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value) && value !== "todos"))].sort((a, b) =>
    a.localeCompare(b, "pt-BR"),
  );

function PieTooltipCustom({ active, payload, totalContratado = 0, contratadoPorProjeto = {}, modo = "valor" }: {
  active?: boolean;
  payload?: any[];
  totalContratado?: number;
  contratadoPorProjeto?: Record<string, number>;
  modo?: string;
}) {
  try {
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0];
    if (!item) return null;

    const valor = Number(item.value) || 0;
    const nome = String(item.name || "");
    const cor = item?.payload?.color || item?.color || CHART_PALETTE[0];
    const percent = item?.percent;

    let pctLabel = "";
    if (modo === "pct_total" && totalContratado > 0) {
      pctLabel = `${((valor / totalContratado) * 100).toFixed(1)}% do total`;
    } else if (modo === "pct_projeto") {
      const contrato = contratadoPorProjeto[nome] || 0;
      pctLabel = contrato > 0 ? `${((valor / contrato) * 100).toFixed(1)}% do projeto` : "—";
    } else if (typeof percent === "number") {
      pctLabel = `${(percent * 100).toFixed(1)}%`;
    }

    return (
      <div className="rounded-xl border border-border/60 bg-background px-4 py-3 shadow-lg text-sm min-w-[200px]">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: cor }} />
          <span className="font-semibold text-foreground leading-tight">{nome}</span>
        </div>
        <div className="text-foreground font-medium">{fmt(valor)}</div>
        {pctLabel && <div className="text-muted-foreground text-xs mt-0.5">{pctLabel}</div>}
      </div>
    );
  } catch {
    return null;
  }
}

interface LegendItemData {
  name: string;
  value: number;
  color: string;
}

function PieLegend({ data, total }: { data: LegendItemData[]; total: number }) {
  return (
    <div className="flex flex-col gap-2 py-2 overflow-y-auto max-h-[320px] pr-1">
      {data.map((item, i) => {
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
        return (
          <div key={i} className="flex items-start gap-2.5 text-sm">
            <span
              className="inline-block h-3 w-3 rounded-sm shrink-0 mt-0.5"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-foreground font-medium leading-tight break-words">{item.name}</div>
              <div className="text-muted-foreground text-xs">
                {fmt(item.value)} · {pct}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string; value: string; icon: React.ElementType }) {
  return (
    <Card className="shadow-md border-border/40 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground font-heading">{value}</div>
      </CardContent>
    </Card>
  );
}

function ProgressCard({ valorMedido, valorTotal, percentual }: { valorMedido: number; valorTotal: number; percentual: number }) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const clampedPct = Math.min(percentual, 100);
  const displayPct = (Math.floor(percentual * 100) / 100).toFixed(2);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(clampedPct), 100);
    return () => clearTimeout(timer);
  }, [clampedPct]);

  return (
    <Card className="shadow-md border-border/40 hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Avanço Financeiro</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold text-foreground font-heading">{displayPct}%</div>
        <Progress value={animatedValue} className="h-2.5 bg-muted [&>div]:transition-all [&>div]:duration-1000 [&>div]:ease-out" />
        <p className="text-xs text-muted-foreground">
          {fmt(valorMedido)} / {fmt(valorTotal)}
        </p>
      </CardContent>
    </Card>
  );
}

function renderPieLabelFn(props: any): string {
  try {
    const percent = props?.percent;
    if (typeof percent !== "number" || percent < 0.03) return "";
    return `${(percent * 100).toFixed(1)}%`;
  } catch {
    return "";
  }
}

export default function DashboardContratos() {
  const { contratosQuery } = useContratos();
  const { medicoesQuery } = useMedicoes();
  const contratos = contratosQuery.data ?? [];
  const medicoes = medicoesQuery.data ?? [];
  const isMobile = useIsMobile();

  const [filtroCliente, setFiltroCliente] = useState<string>("todos");
  const [filtroProjeto, setFiltroProjeto] = useState<string>("todos");
  const [filtroPeriodoDe, setFiltroPeriodoDe] = useState("");
  const [filtroPeriodoAte, setFiltroPeriodoAte] = useState("");

  const handleFiltroClienteChange = useCallback((value: string) => {
    if (!value) return;
    setFiltroCliente(value);
  }, []);

  const handleFiltroProjetoChange = useCallback((value: string) => {
    if (!value) return;
    setFiltroProjeto(value);
  }, []);

  const handleModoMedidoChange = useCallback((value: string) => {
    if (!value) return;
    setModoMedido(value as "valor" | "pct_total" | "pct_projeto");
  }, []);

  const clientes = useMemo(() => sanitizeSelectOptions(contratos.map((c) => c.cliente)), [contratos]);
  const projetos = useMemo(() => sanitizeSelectOptions(contratos.map((c) => c.projeto_obra)), [contratos]);

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
    contratos.forEach((c) => {
      map[c.id] = c.projeto_obra;
    });
    return map;
  }, [contratos]);

  const projetosFiltrados = useMemo(() => {
    return [...new Set(contratosFiltrados.map((c) => c.projeto_obra))].sort();
  }, [contratosFiltrados]);

  const projetoColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    const allProjetos = [...new Set(contratos.map((c) => c.projeto_obra))].sort();
    allProjetos.forEach((p, i) => {
      map[p] = CHART_PALETTE[i % CHART_PALETTE.length];
    });
    return map;
  }, [contratos]);

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
      .map(([mes, projetosMes]) => ({
        mes: mes.split("-").reverse().join("/"),
        ...projetosMes,
      }));
  }, [medicoesFiltradas, contratoMap]);

  // Line chart data: Previsto (proportional monthly), Realizado (monthly), Acumulado (cumulative realized)
  const dadosLinhas = useMemo(() => {
    if (medicoesFiltradas.length === 0 || contratosFiltrados.length === 0) return [];

    // Get all months from medições
    const mesesSet = new Set<string>();
    medicoesFiltradas.forEach((m) => mesesSet.add(m.data_inicio.substring(0, 7)));
    const meses = [...mesesSet].sort();

    if (meses.length === 0) return [];

    // Previsto = valor total contratado / number of months (linear distribution)
    const previstoMensal = valorTotalContratado / meses.length;

    let acumulado = 0;
    return meses.map((mes) => {
      const realizadoMes = medicoesFiltradas
        .filter((m) => m.data_inicio.substring(0, 7) === mes)
        .reduce((s, m) => s + Number(m.valor_medido), 0);
      acumulado += realizadoMes;
      return {
        mes: mes.split("-").reverse().join("/"),
        Previsto: Math.round(previstoMensal * 100) / 100,
        Realizado: Math.round(realizadoMes * 100) / 100,
        Acumulado: Math.round(acumulado * 100) / 100,
      };
    });
  }, [medicoesFiltradas, contratosFiltrados, valorTotalContratado]);

  const dadosPizza = useMemo(() => {
    return contratosFiltrados.map((c) => ({
      name: c.projeto_obra,
      value: Number(c.valor_contrato),
      color: projetoColorMap[c.projeto_obra] || CHART_PALETTE[0],
    }));
  }, [contratosFiltrados, projetoColorMap]);

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
      .map(([name, value]) => ({
        name,
        value,
        color: projetoColorMap[name] || CHART_PALETTE[0],
      }))
      .filter((d) => d.value > 0);
  }, [medicoesFiltradas, contratoMap, projetoColorMap]);

  const totalPizzaContrato = dadosPizza.reduce((s, d) => s + d.value, 0);
  const totalPizzaMedido = dadosPizzaMedido.reduce((s, d) => s + d.value, 0);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard de Contratos</h1>

      <Card className="shadow-md border-border/40">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cliente</Label>
              <Select key={`cliente-${filtroCliente || "todos"}`} value={filtroCliente} onValueChange={handleFiltroClienteChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60 z-[9999]">
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientes.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Projeto / Obra</Label>
              <Select key={`projeto-${filtroProjeto || "todos"}`} value={filtroProjeto} onValueChange={handleFiltroProjetoChange}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent position="popper" className="max-h-60 z-[9999]">
                  <SelectItem value="todos">Todos</SelectItem>
                  {projetos.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Período de</Label>
              <Input type="date" className="mt-1" value={filtroPeriodoDe} onChange={(e) => setFiltroPeriodoDe(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Período até</Label>
              <Input type="date" className="mt-1" value={filtroPeriodoAte} onChange={(e) => setFiltroPeriodoAte(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Valor Total Contratado" value={fmt(valorTotalContratado)} icon={DollarSign} />
        <StatCard title="Valor Já Medido" value={fmt(valorTotalMedido)} icon={Wallet} />
        <ProgressCard
          valorMedido={valorTotalMedido}
          valorTotal={valorTotalContratado}
          percentual={percentualAvanco}
        />
        <StatCard title="Valor Restante" value={fmt(valorRestante)} icon={BarChart3} />
      </div>

      <ChartErrorBoundary>
        <Card className="shadow-md border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-heading font-bold text-foreground">
              Avanço Financeiro Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dadosLinhas.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-12">Nenhuma medição registrada para o período.</p>
            ) : (
              <div className="w-full h-[320px] lg:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dadosLinhas} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={{ stroke: "hsl(var(--border))" }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={fmtCompact}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) => [fmt(value), name]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid hsl(var(--border))",
                        backgroundColor: "hsl(var(--background))",
                        fontSize: "12px",
                        boxShadow: "0 8px 24px -4px rgba(0,0,0,0.12)",
                      }}
                      cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Previsto"
                      stroke={CHART_PALETTE[0]}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART_PALETTE[0], strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Realizado"
                      stroke={CHART_PALETTE[1]}
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: CHART_PALETTE[1], strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Acumulado"
                      stroke={CHART_PALETTE[2]}
                      strokeWidth={2}
                      strokeDasharray="6 3"
                      dot={{ r: 3, fill: CHART_PALETTE[2], strokeWidth: 2, stroke: "hsl(var(--background))" }}
                      activeDot={{ r: 5 }}
                    />
                    <RechartsLegend
                      wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
                      iconType="line"
                      iconSize={14}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </ChartErrorBoundary>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartErrorBoundary>
          <Card className="shadow-md border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading font-bold text-foreground">
                Valor de Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dadosPizza.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">Nenhum projeto encontrado.</p>
              ) : (
                <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4 items-start`}>
                  <div className={`${isMobile ? "w-full" : "flex-1"} min-h-[280px] h-[320px]`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? "70%" : "78%"}
                          innerRadius="0%"
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={2}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                          label={renderPieLabelFn}
                          labelLine={{
                            stroke: "hsl(var(--muted-foreground))",
                            strokeWidth: 1,
                            strokeOpacity: 0.5,
                          }}
                        >
                          {dadosPizza.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={<PieTooltipCustom totalContratado={totalPizzaContrato} />}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`${isMobile ? "w-full" : "w-[220px] shrink-0"}`}>
                    <PieLegend data={dadosPizza} total={totalPizzaContrato} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ChartErrorBoundary>

        <ChartErrorBoundary>
          <Card className="shadow-md border-border/40">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
              <CardTitle className="text-lg font-heading font-bold text-foreground whitespace-nowrap">
                Projetos — Valor Medido
              </CardTitle>
              <Select key={`modo-${modoMedido}`} value={modoMedido} onValueChange={handleModoMedidoChange}>
                <SelectTrigger className="w-[200px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60 z-[9999]">
                  <SelectItem value="valor">Valor (R$)</SelectItem>
                  <SelectItem value="pct_total">% do contrato total</SelectItem>
                  <SelectItem value="pct_projeto">% do contrato do projeto</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              {dadosPizzaMedido.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">Nenhuma medição encontrada.</p>
              ) : (
                <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-4 items-start`}>
                  <div className={`${isMobile ? "w-full" : "flex-1"} min-h-[280px] h-[320px]`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dadosPizzaMedido}
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? "70%" : "78%"}
                          innerRadius="0%"
                          dataKey="value"
                          nameKey="name"
                          paddingAngle={2}
                          strokeWidth={2}
                          stroke="hsl(var(--background))"
                          label={renderPieLabelFn}
                          labelLine={{
                            stroke: "hsl(var(--muted-foreground))",
                            strokeWidth: 1,
                            strokeOpacity: 0.5,
                          }}
                        >
                          {dadosPizzaMedido.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={
                            <PieTooltipCustom
                              totalContratado={valorTotalContratado}
                              contratadoPorProjeto={valorContratadoPorProjeto}
                              modo={modoMedido}
                            />
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className={`${isMobile ? "w-full" : "w-[220px] shrink-0"}`}>
                    <PieLegend data={dadosPizzaMedido} total={totalPizzaMedido} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </ChartErrorBoundary>
      </div>
    </div>
  );
}
