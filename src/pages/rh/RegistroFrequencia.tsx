import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save, CheckCircle2, Pencil, AlertCircle } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useColaboradores, type Colaborador } from "@/hooks/useColaboradores";
import { useFrequenciaByDate, useUpsertFrequencia, STATUS_FREQUENCIA, type StatusFrequencia } from "@/hooks/useFrequencia";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  "Presente": "bg-green-100 text-green-800 border-green-300",
  "Falta Não Comunicada": "bg-red-100 text-red-800 border-red-300",
  "Falta Comunicada": "bg-orange-100 text-orange-800 border-orange-300",
  "Atestado Médico ou Afastamento": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Férias": "bg-blue-100 text-blue-800 border-blue-300",
  "Desligamento": "bg-gray-100 text-gray-800 border-gray-300",
  "Feriado": "bg-purple-100 text-purple-800 border-purple-300",
  "Descanso Remunerado": "bg-teal-100 text-teal-800 border-teal-300",
};

export default function RegistroFrequencia() {
  const { profile } = useAuthContext();
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [filtroContrato, setFiltroContrato] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<Record<string, StatusFrequencia>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  const dataStr = format(dataSelecionada, "yyyy-MM-dd");
  const { data: colaboradores = [], isLoading: loadingColab } = useColaboradores();
  const { data: frequencias = [], isLoading: loadingFreq } = useFrequenciaByDate(dataStr);
  const upsert = useUpsertFrequencia();

  const colaboradoresAtivos = useMemo(
    () => colaboradores.filter((c) => c.status === "Ativo"),
    [colaboradores]
  );

  const contratosUnicos = useMemo(() => {
    const set = new Set(colaboradoresAtivos.map((c) => c.site_contrato));
    return Array.from(set).sort();
  }, [colaboradoresAtivos]);

  const colaboradoresFiltrados = useMemo(() => {
    let list = colaboradoresAtivos;
    if (filtroContrato !== "todos") {
      list = list.filter((c) => c.site_contrato === filtroContrato);
    }
    if (busca.trim()) {
      const q = busca.toLowerCase();
      list = list.filter((c) => c.nome.toLowerCase().includes(q) || c.cargo.toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [colaboradoresAtivos, filtroContrato, busca]);

  useEffect(() => {
    if (frequencias.length > 0) {
      const map: Record<string, StatusFrequencia> = {};
      frequencias.forEach((f) => {
        map[f.colaborador_id] = f.status as StatusFrequencia;
      });
      setRegistros(map);
    } else {
      setRegistros({});
    }
  }, [frequencias]);

  const getStatus = (colabId: string): StatusFrequencia =>
    registros[colabId] || "Presente";

  const setStatus = (colabId: string, status: StatusFrequencia) => {
    setRegistros((prev) => ({ ...prev, [colabId]: status }));
  };

  const handleSalvar = async () => {
    const records = colaboradoresFiltrados.map((c) => ({
      colaborador_id: c.id,
      data: dataStr,
      status: getStatus(c.id),
      registrado_por: profile?.nome || "Sistema",
      registrado_por_id: profile?.user_id || null,
    }));

    try {
      await upsert.mutateAsync(records);
      toast.success("Frequência salva com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao salvar frequência: " + e.message);
    }
  };

  const handleMarcarTodos = (status: StatusFrequencia) => {
    const map: Record<string, StatusFrequencia> = { ...registros };
    colaboradoresFiltrados.forEach((c) => {
      map[c.id] = status;
    });
    setRegistros(map);
  };

  const totalPorStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_FREQUENCIA.forEach((s) => (counts[s] = 0));
    colaboradoresFiltrados.forEach((c) => {
      const s = getStatus(c.id);
      counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
  }, [colaboradoresFiltrados, registros]);

  const isLoading = loadingColab || loadingFreq;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Frequência</h1>
          <p className="text-muted-foreground text-sm">
            Registre a frequência diária dos colaboradores
          </p>
        </div>
        <Button onClick={handleSalvar} disabled={upsert.isPending || isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {upsert.isPending ? "Salvando..." : "Salvar Frequência"}
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Data</label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(dataSelecionada, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dataSelecionada}
                    onSelect={(d) => { if (d) { setDataSelecionada(d); setCalendarOpen(false); } }}
                    locale={ptBR}
                  />
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
            <div className="space-y-1.5 flex-1">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Nome ou cargo..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Marcar todos como</label>
              <Select onValueChange={(v) => handleMarcarTodos(v as StatusFrequencia)}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_FREQUENCIA.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {STATUS_FREQUENCIA.map((s) => (
          <Card key={s} className="text-center">
            <CardContent className="pt-4 pb-3 px-2">
              <div className="text-2xl font-bold">{totalPorStatus[s] || 0}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-tight">{s}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : colaboradoresFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Nenhum colaborador ativo encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
                  <TableHead className="w-[280px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colaboradoresFiltrados.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{c.nome}</TableCell>
                    <TableCell>{c.cargo}</TableCell>
                    <TableCell>{c.site_contrato}</TableCell>
                    <TableCell>
                      <Select
                        value={getStatus(c.id)}
                        onValueChange={(v) => setStatus(c.id, v as StatusFrequencia)}
                      >
                        <SelectTrigger className={cn("text-xs h-9", statusColors[getStatus(c.id)])}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_FREQUENCIA.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className={cn("text-xs")}>{s}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
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
