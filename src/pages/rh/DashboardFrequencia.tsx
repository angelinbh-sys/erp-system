import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, BarChart3, TrendingDown, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

import { useColaboradores } from "@/hooks/useColaboradores";
import { useFrequenciaByRange, STATUS_FREQUENCIA } from "@/hooks/useFrequencia";
import { cn } from "@/lib/utils";

const COLORS = [
  "hsl(142, 71%, 45%)", // Presente - green
  "hsl(0, 84%, 60%)",   // Falta Não Comunicada - red
  "hsl(25, 95%, 53%)",  // Falta Comunicada - orange
  "hsl(48, 96%, 53%)",  // Atestado - yellow
  "hsl(217, 91%, 60%)", // Férias - blue
  "hsl(0, 0%, 64%)",    // Desligamento - gray
  "hsl(271, 91%, 65%)", // Feriado - purple
];

export default function DashboardFrequencia() {
  const hoje = new Date();
  const [periodo, setPeriodo] = useState<"mes" | "semana" | "custom">("mes");
  const [filtroContrato, setFiltroContrato] = useState<string>("todos");

  const [dataInicio, setDataInicio] = useState<Date>(startOfMonth(hoje));
  const [dataFim, setDataFim] = useState<Date>(endOfMonth(hoje));
  const [calInicioOpen, setCalInicioOpen] = useState(false);
  const [calFimOpen, setCalFimOpen] = useState(false);

  const handlePeriodo = (val: string) => {
    setPeriodo(val as any);
    if (val === "mes") {
      setDataInicio(startOfMonth(hoje));
      setDataFim(endOfMonth(hoje));
    } else if (val === "semana") {
      setDataInicio(subDays(hoje, 6));
      setDataFim(hoje);
    }
  };

  const dataInicioStr = format(dataInicio, "yyyy-MM-dd");
  const dataFimStr = format(dataFim, "yyyy-MM-dd");

  const { data: colaboradores = [], isLoading: loadColab } = useColaboradores();
  const { data: frequencias = [], isLoading: loadFreq } = useFrequenciaByRange(dataInicioStr, dataFimStr);

  const colaboradoresAtivos = useMemo(
    () => colaboradores.filter((c) => c.status === "Ativo"),
    [colaboradores]
  );

  const contratosUnicos = useMemo(() => {
    const set = new Set(colaboradoresAtivos.map((c) => c.site_contrato));
    return Array.from(set).sort();
  }, [colaboradoresAtivos]);

  const colabsFiltrados = useMemo(() => {
    if (filtroContrato === "todos") return colaboradoresAtivos;
    return colaboradoresAtivos.filter((c) => c.site_contrato === filtroContrato);
  }, [colaboradoresAtivos, filtroContrato]);

  const colabIds = useMemo(() => new Set(colabsFiltrados.map((c) => c.id)), [colabsFiltrados]);

  const freqFiltradas = useMemo(
    () => frequencias.filter((f) => colabIds.has(f.colaborador_id)),
    [frequencias, colabIds]
  );

  // Totais por status
  const totaisPorStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_FREQUENCIA.forEach((s) => (counts[s] = 0));
    freqFiltradas.forEach((f) => {
      if (counts[f.status] !== undefined) counts[f.status]++;
    });
    return counts;
  }, [freqFiltradas]);

  const totalRegistros = freqFiltradas.length;

  // Pie chart data
  const pieData = useMemo(
    () =>
      STATUS_FREQUENCIA.map((s, i) => ({
        name: s,
        value: totaisPorStatus[s] || 0,
        color: COLORS[i],
      })).filter((d) => d.value > 0),
    [totaisPorStatus]
  );

  // Bar chart: por dia
  const barData = useMemo(() => {
    if (!dataInicio || !dataFim) return [];
    const days = eachDayOfInterval({ start: dataInicio, end: dataFim > hoje ? hoje : dataFim });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayFreqs = freqFiltradas.filter((f) => f.data === dayStr);
      const row: any = { dia: format(day, "dd/MM") };
      STATUS_FREQUENCIA.forEach((s) => {
        row[s] = dayFreqs.filter((f) => f.status === s).length;
      });
      return row;
    });
  }, [freqFiltradas, dataInicio, dataFim]);

  // Ranking: colaboradores com mais faltas
  const rankingFaltas = useMemo(() => {
    const faltaStatus = ["Falta Não Comunicada", "Falta Comunicada"];
    const counts: Record<string, number> = {};
    freqFiltradas.forEach((f) => {
      if (faltaStatus.includes(f.status)) {
        counts[f.colaborador_id] = (counts[f.colaborador_id] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([id, total]) => {
        const colab = colabsFiltrados.find((c) => c.id === id);
        return { id, nome: colab?.nome || "—", cargo: colab?.cargo || "—", contrato: colab?.site_contrato || "—", total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [freqFiltradas, colabsFiltrados]);

  // Ranking: mais atestados
  const rankingAtestados = useMemo(() => {
    const counts: Record<string, number> = {};
    freqFiltradas.forEach((f) => {
      if (f.status === "Atestado Médico ou Afastamento") {
        counts[f.colaborador_id] = (counts[f.colaborador_id] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([id, total]) => {
        const colab = colabsFiltrados.find((c) => c.id === id);
        return { id, nome: colab?.nome || "—", cargo: colab?.cargo || "—", contrato: colab?.site_contrato || "—", total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [freqFiltradas, colabsFiltrados]);

  const isLoading = loadColab || loadFreq;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard de Frequência</h1>
        <p className="text-muted-foreground text-sm">Análise de frequência dos colaboradores</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={handlePeriodo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semana">Últimos 7 dias</SelectItem>
                  <SelectItem value="mes">Mês atual</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {periodo === "custom" && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">De</label>
                  <Popover open={calInicioOpen} onOpenChange={setCalInicioOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[160px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dataInicio, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dataInicio} onSelect={(d) => { if (d) { setDataInicio(d); setCalInicioOpen(false); } }} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Até</label>
                  <Popover open={calFimOpen} onOpenChange={setCalFimOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-[160px] justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(dataFim, "dd/MM/yyyy")}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={dataFim} onSelect={(d) => { if (d) { setDataFim(d); setCalFimOpen(false); } }} locale={ptBR} />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}
            <div className="space-y-1.5 min-w-[200px]">
              <label className="text-sm font-medium">Contrato</label>
              <Select value={filtroContrato} onValueChange={setFiltroContrato}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os contratos</SelectItem>
                  {contratosUnicos.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {STATUS_FREQUENCIA.map((s, i) => {
              const pct = totalRegistros > 0 ? ((totaisPorStatus[s] / totalRegistros) * 100).toFixed(1) : "0";
              return (
                <Card key={s}>
                  <CardContent className="pt-4 pb-3 px-3 text-center">
                    <div className="text-2xl font-bold">{totaisPorStatus[s]}</div>
                    <div className="text-xs text-muted-foreground leading-tight mt-1">{s}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: COLORS[i] }}>{pct}%</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Distribuição por Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Bar - diário */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Frequência por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="dia" fontSize={11} />
                      <YAxis fontSize={11} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {STATUS_FREQUENCIA.map((s, i) => (
                        <Bar key={s} dataKey={s} stackId="a" fill={COLORS[i]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ranking faltas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  Maiores Índices de Faltas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingFaltas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma falta registrada no período.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead className="text-right">Faltas</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingFaltas.map((r, i) => (
                        <TableRow key={r.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{r.nome}</TableCell>
                          <TableCell>{r.cargo}</TableCell>
                          <TableCell>{r.contrato}</TableCell>
                          <TableCell className="text-right font-bold text-destructive-foreground">{r.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Ranking atestados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-yellow-600" />
                  Maiores Índices de Atestados / Afastamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rankingAtestados.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum atestado registrado no período.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead>Contrato</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankingAtestados.map((r, i) => (
                        <TableRow key={r.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{r.nome}</TableCell>
                          <TableCell>{r.cargo}</TableCell>
                          <TableCell>{r.contrato}</TableCell>
                          <TableCell className="text-right font-bold text-yellow-600">{r.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
