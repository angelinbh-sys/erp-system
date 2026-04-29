import { useState, useMemo, useEffect } from "react";
import { format, startOfDay, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Save, CheckCircle2, Pencil, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useColaboradores } from "@/hooks/useColaboradores";
import {
  useFrequenciaByDate,
  useFrequenciaByRange,
  useUpsertFrequencia,
  STATUS_FREQUENCIA,
  type StatusFrequencia,
} from "@/hooks/useFrequencia";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

import FrequenciaCalendar from "@/components/frequencia/FrequenciaCalendar";

const statusColors: Record<string, string> = {
  "Presente": "bg-green-100 text-green-800 border-green-300",
  "Falta Não Comunicada": "bg-red-100 text-red-800 border-red-300",
  "Falta Comunicada": "bg-orange-100 text-orange-800 border-orange-300",
  "Atestado Médico ou Afastamento": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Férias": "bg-blue-100 text-blue-800 border-blue-300",
  "Desligamento": "bg-gray-100 text-gray-800 border-gray-300",
  "Feriado": "bg-purple-100 text-purple-800 border-purple-300",
  "Descanso Remunerado": "bg-teal-100 text-teal-800 border-teal-300",
  "Suspensão": "bg-rose-100 text-rose-800 border-rose-300",
};

export default function RegistroFrequencia() {
  const { profile } = useAuthContext();
  const [mesAtual, setMesAtual] = useState<Date>(startOfMonth(new Date()));
  const [dataSelecionada, setDataSelecionada] = useState<Date | null>(null);
  const [filtroContrato, setFiltroContrato] = useState<string>("todos");
  const [contratoErro, setContratoErro] = useState(false);
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<Record<string, StatusFrequencia>>({});
  const [modoEdicao, setModoEdicao] = useState(false);
  const [justificativaDialog, setJustificativaDialog] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [diasPreenchendo, setDiasPreenchendo] = useState<Set<string>>(new Set());

  const hoje = startOfDay(new Date());

  // Query for the selected day
  const dataStr = dataSelecionada ? format(dataSelecionada, "yyyy-MM-dd") : null;
  const dataFutura = dataSelecionada ? isAfter(startOfDay(dataSelecionada), hoje) : false;
  const { data: colaboradores = [], isLoading: loadingColab } = useColaboradores();
  const { data: frequencias = [], isLoading: loadingFreq } = useFrequenciaByDate(dataStr);
  const upsert = useUpsertFrequencia();

  // Range query for the whole month to determine day statuses
  const mesInicioStr = format(startOfMonth(mesAtual), "yyyy-MM-dd");
  const mesFimStr = format(endOfMonth(mesAtual), "yyyy-MM-dd");
  const { data: frequenciasMes = [] } = useFrequenciaByRange(mesInicioStr, mesFimStr);

  const colaboradoresAtivos = useMemo(
    () => colaboradores.filter((c) => c.status === "Ativo"),
    [colaboradores]
  );

  const contratosUnicos = useMemo(() => {
    const set = new Set(colaboradoresAtivos.map((c) => c.site_contrato));
    return Array.from(set).sort();
  }, [colaboradoresAtivos]);

  // IDs of collaborators matching the current contract filter
  const colabIdsFiltrados = useMemo(() => {
    if (filtroContrato === "todos") return null;
    const set = new Set(
      colaboradoresAtivos
        .filter((c) => c.site_contrato === filtroContrato)
        .map((c) => c.id)
    );
    return set;
  }, [colaboradoresAtivos, filtroContrato]);

  // Compute which days have saved records (filtered by contract)
  const diasFinalizados = useMemo(() => {
    const set = new Set<string>();
    const filtered = colabIdsFiltrados
      ? frequenciasMes.filter((f) => colabIdsFiltrados.has(f.colaborador_id))
      : frequenciasMes;
    filtered.forEach((f) => set.add(f.data));
    return set;
  }, [frequenciasMes, colabIdsFiltrados]);

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

  // Check if there are existing records for the FILTERED collaborators (not all)
  const jaTemRegistro = useMemo(() => {
    if (frequencias.length === 0) return false;
    const colabIds = new Set(colaboradoresFiltrados.map((c) => c.id));
    return frequencias.some((f) => colabIds.has(f.colaborador_id));
  }, [frequencias, colaboradoresFiltrados]);

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
    setModoEdicao(false);
    setJustificativa("");
  }, [frequencias]);

  const getStatus = (colabId: string): StatusFrequencia =>
    registros[colabId] || "Presente";

  const setStatus = (colabId: string, status: StatusFrequencia) => {
    setRegistros((prev) => ({ ...prev, [colabId]: status }));
  };

  const handleSalvar = async () => {
    if (!dataSelecionada || dataFutura) {
      toast.error("Não é permitido registrar frequência para datas futuras.");
      return;
    }

    const records = colaboradoresFiltrados.map((c) => ({
      colaborador_id: c.id,
      data: dataStr!,
      status: getStatus(c.id),
      registrado_por: profile?.nome || "Sistema",
      registrado_por_id: profile?.user_id || null,
      observacao: modoEdicao ? `[Edição] Justificativa: ${justificativa}` : null,
    }));

    try {
      await upsert.mutateAsync(records);
      toast.success("Frequência salva com sucesso!");
      setModoEdicao(false);
      setJustificativa("");
      // Remove from "preenchendo" and it will show as "finalizado" after refetch
      setDiasPreenchendo((prev) => {
        const next = new Set(prev);
        next.delete(dataStr!);
        return next;
      });
    } catch (e: any) {
      toast.error("Erro ao salvar frequência: " + e.message);
    }
  };

  const handleEditarClick = () => {
    setJustificativaDialog(true);
  };

  const handleConfirmarEdicao = () => {
    if (!justificativa.trim()) {
      toast.error("É necessário informar uma justificativa para editar a frequência.");
      return;
    }
    setJustificativaDialog(false);
    setModoEdicao(true);
  };

  const handleMarcarTodos = (status: StatusFrequencia) => {
    const map: Record<string, StatusFrequencia> = { ...registros };
    colaboradoresFiltrados.forEach((c) => {
      map[c.id] = status;
    });
    setRegistros(map);
  };

  const handleDayClick = (day: Date) => {
    if (filtroContrato === "todos") {
      setContratoErro(true);
      toast.error("Selecione um contrato antes de registrar a frequência.");
      return;
    }
    setContratoErro(false);
    setDataSelecionada(day);
    const key = format(day, "yyyy-MM-dd");
    // Mark as "preenchendo" if not already finalized
    if (!diasFinalizados.has(key)) {
      setDiasPreenchendo((prev) => new Set(prev).add(key));
    }
  };

  const handleVoltarCalendario = () => {
    setDataSelecionada(null);
    // Mantém o filtro de contrato (seleção principal do usuário) e
    // reseta explicitamente apenas a busca para evitar filtro residual.
    setBusca("");
    setModoEdicao(false);
    setJustificativa("");
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
  const bloqueado = dataFutura || (jaTemRegistro && !modoEdicao);

  // === CALENDAR VIEW (no day selected) ===
  if (!dataSelecionada) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Registro de Frequência</h1>
          <p className="text-muted-foreground text-sm">
            Clique em um dia do calendário para registrar a frequência
          </p>
        </div>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="space-y-1.5 min-w-[240px]">
                <label className={cn("text-sm font-medium", contratoErro && "text-destructive")}>
                  Contrato {contratoErro && "*"}
                </label>
                <Select
                  value={filtroContrato}
                  onValueChange={(v) => {
                    setFiltroContrato(v);
                    if (v !== "todos") setContratoErro(false);
                  }}
                >
                  <SelectTrigger className={cn(contratoErro && "border-destructive ring-1 ring-destructive")}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os contratos</SelectItem>
                    {contratosUnicos.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {contratoErro && (
                  <p className="text-xs text-destructive">
                    Selecione um contrato antes de clicar em um dia do calendário.
                  </p>
                )}
              </div>
            </div>
            <FrequenciaCalendar
              mesAtual={mesAtual}
              onMesChange={setMesAtual}
              onDayClick={handleDayClick}
              diaSelecionado={dataSelecionada}
              diasFinalizados={diasFinalizados}
              diasPreenchendo={diasPreenchendo}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // === DAY DETAIL VIEW (day selected) ===
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleVoltarCalendario}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Frequência — {format(dataSelecionada, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
            </h1>
            <p className="text-muted-foreground text-sm">
              Registre a frequência dos colaboradores para este dia
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {jaTemRegistro && !modoEdicao && !dataFutura && (
            <Button variant="outline" onClick={handleEditarClick}>
              <Pencil className="h-4 w-4 mr-2" />
              Editar Frequência
            </Button>
          )}
          <Button
            onClick={handleSalvar}
            disabled={upsert.isPending || isLoading || bloqueado}
          >
            <Save className="h-4 w-4 mr-2" />
            {upsert.isPending ? "Salvando..." : "Salvar Frequência"}
          </Button>
        </div>
      </div>

      {dataFutura && (
        <Alert className="border-red-400 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Não é permitido registrar frequência para datas futuras.
          </AlertDescription>
        </Alert>
      )}

      {jaTemRegistro && !modoEdicao && !dataFutura && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Frequência já registrada para este dia. Clique em <strong>Editar Frequência</strong> para alterar.
          </AlertDescription>
        </Alert>
      )}

      {modoEdicao && (
        <Alert className="border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            Modo de edição ativado. Justificativa: <strong>{justificativa}</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtros (sem filtro de contrato — definido na tela do calendário) */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="space-y-1.5 min-w-[220px]">
              <label className="text-sm font-medium">Contrato</label>
              <Input value={filtroContrato} disabled />
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
              <Select onValueChange={(v) => handleMarcarTodos(v as StatusFrequencia)} disabled={bloqueado}>
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
                        disabled={bloqueado}
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

      {/* Dialog de justificativa para edição */}
      <Dialog open={justificativaDialog} onOpenChange={setJustificativaDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificativa para Edição</DialogTitle>
            <DialogDescription>
              Informe o motivo da edição da frequência do dia {format(dataSelecionada, "dd/MM/yyyy")}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa *</Label>
            <Textarea
              id="justificativa"
              placeholder="Descreva o motivo da edição..."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustificativaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmarEdicao}>
              Confirmar Edição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
