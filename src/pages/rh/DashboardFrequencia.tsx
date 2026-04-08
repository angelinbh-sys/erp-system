import { useState, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, isBefore, eachDayOfInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, BarChart3, TrendingDown, Users, FileText } from "lucide-react";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  "Suspensão": "hsl(350, 80%, 55%)",
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


  // Horizontal bar data for today
  const hojeStr = format(hoje, "yyyy-MM-dd");
  const horizontalBarData = useMemo(() => {
    const hojeFreqs = freqFiltradas.filter((f) => f.data === hojeStr);
    return STATUS_ANALISE.map((s) => ({
      status: s,
      quantidade: hojeFreqs.filter((f) => f.status === s).length,
      fill: COLORS[s],
    })).filter((d) => d.quantidade > 0);
  }, [freqFiltradas, hojeStr]);

  // Não presentes hoje (todos exceto "Presente")
  const naoPresentesHoje = useMemo(() => {
    const hojeFreqs = freqFiltradas.filter((f) => f.data === hojeStr && f.status !== "Presente");
    return hojeFreqs.map((f) => {
      const colab = colabsFiltrados.find((c) => c.id === f.colaborador_id);
      return {
        nome: colab?.nome || "—",
        cargo: colab?.cargo || "—",
        contrato: colab?.site_contrato || "—",
        status: f.status,
      };
    }).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [freqFiltradas, colabsFiltrados, hojeStr]);

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

  // Helper: convert HSL string to RGB for jsPDF
  const hslToRgb = (hslStr: string): [number, number, number] => {
    const match = hslStr.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!match) return [100, 100, 100];
    const h = parseInt(match[1]) / 360;
    const s = parseInt(match[2]) / 100;
    const l = parseInt(match[3]) / 100;
    let r: number, g: number, b: number;
    if (s === 0) { r = g = b = l; } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1; if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  };

  // PDF report generation
  const gerarRelatorioPDF = useCallback(() => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const marginL = 14;
    const marginR = 14;
    let y = 18;

    const addPage = () => { doc.addPage(); y = 18; };
    const checkPage = (need: number) => { if (y + need > 280) addPage(); };

    // --- Draw pie chart helper ---
    const drawPieChart = (data: { name: string; value: number; color: string }[], cx: number, cy: number, radius: number) => {
      const total = data.reduce((a, b) => a + b.value, 0);
      if (total === 0) return;
      let startAngle = -Math.PI / 2;
      data.forEach((item) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        const [r, g, b] = hslToRgb(item.color);
        doc.setFillColor(r, g, b);
        // Draw slice as filled triangle fan
        const steps = Math.max(20, Math.ceil(sliceAngle / 0.05));
        const points: [number, number][] = [[cx, cy]];
        for (let i = 0; i <= steps; i++) {
          const angle = startAngle + (sliceAngle * i) / steps;
          points.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
        }
        // Use triangle method for each sub-triangle
        for (let i = 1; i < points.length - 1; i++) {
          doc.triangle(
            points[0][0], points[0][1],
            points[i][0], points[i][1],
            points[i + 1][0], points[i + 1][1],
            "F"
          );
        }
        // Draw percentage label
        const midAngle = startAngle + sliceAngle / 2;
        const labelR = radius + 12;
        const lx = cx + labelR * Math.cos(midAngle);
        const ly = cy + labelR * Math.sin(midAngle);
        const pct = ((item.value / total) * 100).toFixed(1);
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text(`${pct}%`, lx, ly, { align: lx > cx ? "left" : "right", baseline: "middle" });
        startAngle += sliceAngle;
      });
      doc.setTextColor(0, 0, 0);
    };

    // --- Draw horizontal bar chart helper ---
    const drawHBarChart = (data: { label: string; value: number; color: string }[], x: number, yStart: number, chartW: number, barH: number) => {
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      let cy = yStart;
      data.forEach((item) => {
        // Label
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        const labelMaxW = 55;
        const truncLabel = item.label.length > 28 ? item.label.substring(0, 26) + "…" : item.label;
        doc.text(truncLabel, x + labelMaxW - 2, cy + barH / 2, { align: "right", baseline: "middle" });
        // Bar
        const barW = (item.value / maxVal) * (chartW - labelMaxW - 15);
        const [r, g, b] = hslToRgb(item.color);
        doc.setFillColor(r, g, b);
        doc.roundedRect(x + labelMaxW, cy, barW, barH, 1.5, 1.5, "F");
        // Value
        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        doc.text(`${item.value}`, x + labelMaxW + barW + 3, cy + barH / 2, { baseline: "middle" });
        cy += barH + 3;
      });
      doc.setTextColor(0, 0, 0);
      return cy;
    };

    // --- Draw legend helper ---
    const drawLegend = (data: { name: string; color: string }[], x: number, yStart: number) => {
      let ly = yStart;
      data.forEach((item) => {
        const [r, g, b] = hslToRgb(item.color);
        doc.setFillColor(r, g, b);
        doc.rect(x, ly - 2.5, 3, 3, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(item.name, x + 5, ly, { baseline: "middle" });
        ly += 5;
      });
      doc.setTextColor(0, 0, 0);
      return ly;
    };

    // Header
    const maxW = pageW - marginL - marginR;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Frequência", pageW / 2, y, { align: "center" });
    y += 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Período: ${format(dataInicio, "dd/MM/yyyy")} a ${format(dataFim, "dd/MM/yyyy")}`, pageW / 2, y, { align: "center" });
    y += 5;
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, pageW / 2, y, { align: "center" });
    y += 5;
    if (filtroContrato !== "todos") {
      doc.text(`Contrato: ${filtroContrato}`, pageW / 2, y, { align: "center" });
      y += 5;
    }
    y += 4;
    doc.setDrawColor(180);
    doc.line(marginL, y, pageW - marginR, y);
    y += 8;

    // For each contract
    const contratos = filtroContrato !== "todos" ? [filtroContrato] : contratosUnicos;

    contratos.forEach((contrato) => {
      const colabsContrato = colabsFiltrados.filter((c) => c.site_contrato === contrato);
      const colabIdsContrato = new Set(colabsContrato.map((c) => c.id));
      const freqContrato = freqFiltradas.filter((f) => colabIdsContrato.has(f.colaborador_id));

      checkPage(30);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text(`Contrato: ${contrato}`, marginL, y);
      y += 6;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Total de colaboradores ativos: ${colabsContrato.length}`, marginL, y);
      y += 8;

      // ---- FREQUÊNCIA DO DIA (hoje) - GRÁFICO DE BARRAS ----
      checkPage(20);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Frequência do Dia — ${format(hoje, "dd/MM/yyyy")}`, marginL, y);
      y += 6;

      const freqHojeContrato = freqContrato.filter((f) => f.data === hojeStr);
      const statusCountHoje: Record<string, number> = {};
      STATUS_ANALISE.forEach((s) => (statusCountHoje[s] = 0));
      freqHojeContrato.forEach((f) => { if (statusCountHoje[f.status] !== undefined) statusCountHoje[f.status]++; });

      const barDataHoje = STATUS_ANALISE
        .filter((s) => statusCountHoje[s] > 0)
        .map((s) => ({ label: s, value: statusCountHoje[s], color: COLORS[s] }));

      if (barDataHoje.length > 0) {
        const barH = 6;
        const chartHeight = barDataHoje.length * (barH + 3) + 5;
        checkPage(chartHeight + 5);
        y = drawHBarChart(barDataHoje, marginL, y, maxW, barH);
        y += 3;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Sem dados para hoje.", marginL, y);
        y += 5;
      }

      // Ausentes do dia
      const ausentesHoje = freqHojeContrato.filter((f) => f.status !== "Presente");
      if (ausentesHoje.length > 0) {
        y += 3;
        checkPage(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("Colaboradores não presentes:", marginL, y);
        y += 5;

        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const colWidths = [60, 50, 70];
        doc.text("Nome", marginL, y);
        doc.text("Cargo", marginL + colWidths[0], y);
        doc.text("Motivo", marginL + colWidths[0] + colWidths[1], y);
        y += 1;
        doc.line(marginL, y, pageW - marginR, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        ausentesHoje.forEach((f) => {
          checkPage(5);
          const colab = colabsContrato.find((c) => c.id === f.colaborador_id);
          doc.text((colab?.nome || "—").substring(0, 30), marginL, y);
          doc.text((colab?.cargo || "—").substring(0, 25), marginL + colWidths[0], y);
          doc.text(f.status.substring(0, 35), marginL + colWidths[0] + colWidths[1], y);
          y += 5;
        });
      }

      y += 6;

      // ---- RESUMO DO MÊS - GRÁFICO DE PIZZA ----
      checkPage(80);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(`Resumo do Mês (${format(dataInicio, "MMMM/yyyy", { locale: ptBR })})`, marginL, y);
      y += 4;

      const statusCountMes: Record<string, number> = {};
      STATUS_ANALISE.forEach((s) => (statusCountMes[s] = 0));
      freqContrato.forEach((f) => { if (statusCountMes[f.status] !== undefined) statusCountMes[f.status]++; });
      const totalMes = freqContrato.length;

      const pieDataPdf = STATUS_ANALISE
        .filter((s) => statusCountMes[s] > 0)
        .map((s) => ({ name: s, value: statusCountMes[s], color: COLORS[s] }));

      if (pieDataPdf.length > 0) {
        const pieRadius = 28;
        const pieCx = marginL + 45;
        const pieCy = y + pieRadius + 5;
        drawPieChart(pieDataPdf, pieCx, pieCy, pieRadius);
        // Legend to the right of pie
        const legendX = pieCx + pieRadius + 25;
        drawLegend(
          pieDataPdf.map((d) => ({ name: `${d.name}: ${d.value} (${totalMes > 0 ? ((d.value / totalMes) * 100).toFixed(1) : 0}%)`, color: d.color })),
          legendX, y + 8
        );
        y = pieCy + pieRadius + 12;
      } else {
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("Sem dados no período.", marginL, y + 4);
        y += 10;
      }

      y += 4;

      // ---- RANKING FALTAS DO CONTRATO ----
      const faltaStatus = ["Falta Não Comunicada", "Falta Comunicada"];
      const faltasMap: Record<string, number> = {};
      freqContrato.forEach((f) => {
        if (faltaStatus.includes(f.status)) faltasMap[f.colaborador_id] = (faltasMap[f.colaborador_id] || 0) + 1;
      });
      const topFaltas = Object.entries(faltasMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      if (topFaltas.length > 0) {
        checkPage(14);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Maiores Índices de Faltas:", marginL, y);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        topFaltas.forEach(([id, total]) => {
          checkPage(5);
          const colab = colabsContrato.find((c) => c.id === id);
          doc.text(`  ${colab?.nome || "—"} — ${total} falta(s)`, marginL, y);
          y += 5;
        });
        y += 3;
      }

      // ---- RANKING ATESTADOS DO CONTRATO ----
      const atestMap: Record<string, number> = {};
      freqContrato.forEach((f) => {
        if (f.status === "Atestado Médico ou Afastamento") atestMap[f.colaborador_id] = (atestMap[f.colaborador_id] || 0) + 1;
      });
      const topAtest = Object.entries(atestMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

      if (topAtest.length > 0) {
        checkPage(14);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Maiores Índices de Atestados / Afastamentos:", marginL, y);
        y += 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        topAtest.forEach(([id, total]) => {
          checkPage(5);
          const colab = colabsContrato.find((c) => c.id === id);
          doc.text(`  ${colab?.nome || "—"} — ${total} ocorrência(s)`, marginL, y);
          y += 5;
        });
        y += 3;
      }

      // Separador entre contratos
      y += 4;
      checkPage(4);
      doc.setDrawColor(200);
      doc.line(marginL, y, pageW - marginR, y);
      y += 8;
    });

    doc.save(`relatorio-frequencia-${format(hoje, "yyyy-MM-dd")}.pdf`);
    toast.success("Relatório PDF gerado com sucesso!");
  }, [dataInicio, dataFim, filtroContrato, contratosUnicos, colabsFiltrados, freqFiltradas, hojeStr, hoje]);

  const isLoading = loadColab || loadFreq;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard de Frequência</h1>
          <p className="text-muted-foreground text-sm">Análise de frequência dos colaboradores</p>
        </div>
        <Button onClick={gerarRelatorioPDF} disabled={isLoading} className="gap-2">
          <FileText className="h-4 w-4" />
          Emitir Relatório
        </Button>
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

            {/* Horizontal bar chart - Frequência do Dia (hoje) + ausentes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Frequência do Dia — {format(hoje, "dd/MM/yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {horizontalBarData.length === 0 ? (
                  <div className="h-[260px] flex items-center justify-center text-muted-foreground">
                    Sem dados para hoje
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(260, horizontalBarData.length * 48)}>
                    <BarChart data={horizontalBarData} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <YAxis type="category" dataKey="status" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} width={180} />
                      <ReTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 text-sm">
                              <p className="font-medium" style={{ color: d.fill }}>{d.status}</p>
                              <p className="text-foreground">Quantidade: <strong>{d.quantidade}</strong></p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="quantidade" radius={[0, 4, 4, 0]} barSize={20}>
                        {horizontalBarData.map((d, i) => (
                          <Cell key={i} fill={d.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {/* Lista de ausentes do dia */}
                {naoPresentesHoje.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4 text-destructive" />
                      Colaboradores Não Presentes Hoje ({naoPresentesHoje.length})
                    </h4>
                    <ScrollArea className="max-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Cargo</TableHead>
                            <TableHead>Contrato</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {naoPresentesHoje.map((a, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{a.nome}</TableCell>
                              <TableCell>{a.cargo}</TableCell>
                              <TableCell>{a.contrato}</TableCell>
                              <TableCell className="text-xs text-destructive font-medium">{a.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}

                {naoPresentesHoje.length === 0 && horizontalBarData.length > 0 && (
                  <p className="text-sm text-muted-foreground">Todos os colaboradores estão presentes hoje.</p>
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
