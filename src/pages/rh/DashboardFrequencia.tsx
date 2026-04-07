import { useState, useMemo } from "react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isBefore, startOfDay } from "date-fns";
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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, Tooltip,
} from "recharts";

import { useColaboradores } from "@/hooks/useColaboradores";
import { useFrequenciaByRange, STATUS_FREQUENCIA } from "@/hooks/useFrequencia";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Status excluídos da análise
const STATUS_EXCLUIDOS = ["Feriado", "Descanso Remunerado"];
const STATUS_ANALISE = STATUS_FREQUENCIA.filter((s) => !STATUS_EXCLUIDOS.includes(s));

const COLORS: Record<string, string> = {
  "Presente": "hsl(142, 71%, 45%)",
  "Falta Não Comunicada": "hsl(0, 84%, 60%)",
  "Falta Comunicada": "hsl(25, 95%, 53%)",
  "Atestado Médico ou Afastamento": "hsl(48, 96%, 53%)",
  "Férias": "hsl(217, 91%, 60%)",
  "Desligamento": "hsl(0, 0%, 64%)",
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium" style={{ color: d.payload.color }}>{d.name}</p>
      <p className="text-foreground">Quantidade: <strong>{d.value}</strong></p>
      <p className="text-foreground">Percentual: <strong>{((d.payload.percent || 0) * 100).toFixed(1)}%</strong></p>
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.filter((p: any) => p.value > 0).map((p: any) => (
        <p key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <strong className="text-foreground">{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function DashboardFrequencia() {
  const hoje = new Date();
  const [filtroContrato, setFiltroContrato] = useState<string>("todos");

  const [dataInicio, setDataInicio] = useState<Date>(startOfMonth(hoje));
  const [dataFim, setDataFim] = useState<Date>(endOfMonth(hoje));
  const [calInicioOpen, setCalInicioOpen] = useState(false);
  const [calFimOpen, setCalFimOpen] = useState(false);

  const handleDataInicio = (d: Date | undefined) => {
    if (!d) return;
    if (isBefore(dataFim, d)) {
      toast.error("A data final não pode ser menor que a data inicial.");
      return;
    }
    setDataInicio(d);
    setCalInicioOpen(false);
  };

  const handleDataFim = (d: Date | undefined) => {
    if (!d) return;
    if (isBefore(d, dataInicio)) {
      toast.error("A data final não pode ser menor que a data inicial.");
      return;
    }
    setDataFim(d);
    setCalFimOpen(false);
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

  // Frequências filtradas excluindo status que não entram na análise
  const freqFiltradas = useMemo(
    () => frequencias.filter((f) => colabIds.has(f.colaborador_id) && !STATUS_EXCLUIDOS.includes(f.status)),
    [frequencias, colabIds]
  );

  // Totais por status (apenas análise)
  const totaisPorStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_ANALISE.forEach((s) => (counts[s] = 0));
    freqFiltradas.forEach((f) => {
      if (counts[f.status] !== undefined) counts[f.status]++;
    });
    return counts;
  }, [freqFiltradas]);

  const totalRegistros = freqFiltradas.length;

  // Pie data
  const pieData = useMemo(() => {
    const items = STATUS_ANALISE.map((s) => ({
      name: s,
      value: totaisPorStatus[s] || 0,
      color: COLORS[s],
    })).filter((d) => d.value > 0);
    const total = items.reduce((a, b) => a + b.value, 0);
    return items.map((d) => ({ ...d, percent: total > 0 ? d.value / total : 0 }));
  }, [totaisPorStatus]);

  // Bar chart: por dia
  const barData = useMemo(() => {
    if (!dataInicio || !dataFim) return [];
    const end = dataFim > hoje ? hoje : dataFim;
    const days = eachDayOfInterval({ start: dataInicio, end });
    return days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayFreqs = freqFiltradas.filter((f) => f.data === dayStr);
      const row: any = { dia: format(day, "dd/MM") };
      STATUS_ANALISE.forEach((s) => {
        row[s] = dayFreqs.filter((f) => f.status === s).length;
      });
      return row;
    });
  }, [freqFiltradas, dataInicio, dataFim]);

  // Ausentes no período
  const ausentesNoPeriodo = useMemo(() => {
    const statusAusencia = ["Falta Não Comunicada", "Falta Comunicada", "Atestado Médico ou Afastamento"];
    const ausMap: Record<string, { nome: string; cargo: string; contrato: string; dias: number; status: string[] }> = {};
    freqFiltradas.forEach((f) => {
      if (statusAusencia.includes(f.status)) {
        if (!ausMap[f.colaborador_id]) {
          const colab = colabsFiltrados.find((c) => c.id === f.colaborador_id);
          ausMap[f.colaborador_id] = {
            nome: colab?.nome || "—",
            cargo: colab?.cargo || "—",
            contrato: colab?.site_contrato || "—",
            dias: 0,
            status: [],
          };
        }
        ausMap[f.colaborador_id].dias++;
        if (!ausMap[f.colaborador_id].status.includes(f.status)) {
          ausMap[f.colaborador_id].status.push(f.status);
        }
      }
    });
    return Object.values(ausMap).sort((a, b) => b.dias - a.dias);
  }, [freqFiltradas, colabsFiltrados]);

  // Ranking faltas
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

  // Ranking atestados
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
              <label className="text-sm font-medium">Data inicial</label>
              <Popover open={calInicioOpen} onOpenChange={setCalInicioOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[160px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataInicio, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={handleDataInicio} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data final</label>
              <Popover open={calFimOpen} onOpenChange={setCalFimOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[160px] justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataFim, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={handleDataFim} locale={ptBR} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
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
          {/* KPIs - apenas status de análise */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {STATUS_ANALISE.map((s) => {
              const pct = totalRegistros > 0 ? ((totaisPorStatus[s] / totalRegistros) * 100).toFixed(1) : "0";
              return (
                <Card key={s}>
                  <CardContent className="pt-4 pb-3 px-3 text-center">
                    <div className="text-2xl font-bold">{totaisPorStatus[s]}</div>
                    <div className="text-xs text-muted-foreground leading-tight mt-1">{s}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: COLORS[s] }}>{pct}%</div>
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
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ percent, cx, cy, midAngle, outerRadius: or }) => {
                          const RADIAN = Math.PI / 180;
                          const radius = or + 20;
                          const x = cx + radius * Math.cos(-midAngle * RADIAN);
                          const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          return (
                            <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" className="fill-foreground" style={{ fontSize: 12, fontWeight: 600 }}>
                              {`${(percent * 100).toFixed(1)}%`}
                            </text>
                          );
                        }}
                        labelLine={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                      >
                        {pieData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconType="circle"
                        iconSize={10}
                        wrapperStyle={{ fontSize: 12, paddingLeft: 16 }}
                        formatter={(value: string) => <span className="text-foreground">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Line chart - por dia */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Frequência por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lineData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    Sem dados no período
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={340}>
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dia" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <ReTooltip content={<CustomLineTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
                      {STATUS_ANALISE.map((s) => (
                        <Line
                          key={s}
                          type="monotone"
                          dataKey={s}
                          stroke={COLORS[s]}
                          strokeWidth={2}
                          dot={{ r: 3, fill: COLORS[s] }}
                          activeDot={{ r: 5 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rankings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          <TableCell className="text-right font-bold text-destructive">{r.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

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
                          <TableCell className="text-right font-bold text-destructive">{r.total}</TableCell>
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
