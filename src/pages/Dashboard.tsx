import { useMemo } from "react";
import {
  SkeletonKpiGrid,
  SkeletonAniversariantes,
  SkeletonAtividades,
  SkeletonTableCard,
} from "@/components/dashboard/DashboardSkeletons";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  Clock,
  UserSearch,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVagas, useUpdateVagaStatus } from "@/hooks/useVagas";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { useAuthContext } from "@/contexts/AuthContext";
import { useColaboradores } from "@/hooks/useColaboradores";
import { toast } from "@/lib/toast";
import { STATUS_PROCESSO } from "@/utils/statusProcesso";
import PainelPendencias from "@/components/PainelPendencias";

/* ─── Status badge helpers ──────────────────────────────────────── */
function vagaStatusBadge(status: string) {
  switch (status) {
    case "Aprovada":
      return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]/80">{status}</Badge>;
    case "Reprovada":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function candidatoStatusBadge(status: string) {
  switch (status) {
    case "Aprovado":
      return <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:bg-[hsl(var(--success))]/80">{status}</Badge>;
    case "Reprovado":
      return <Badge variant="destructive">{status}</Badge>;
    default:
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500/80">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── KPI Card ──────────────────────────────────────────────────── */
function KpiCard({
  icon: Icon,
  title,
  value,
  color,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Birthday helpers ──────────────────────────────────────────── */
function isBirthdayToday(dateStr: string | null) {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

function isBirthdayThisMonth(dateStr: string | null) {
  if (!dateStr) return false;
  const today = new Date();
  const d = new Date(dateStr + "T00:00:00");
  return d.getMonth() === today.getMonth() && d.getDate() !== today.getDate();
}

function formatBirthdayDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

/* ─── Dashboard ─────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const { data: vagas = [], isLoading: loadingVagas } = useVagas();
  const grupoNotif = profile?.super_admin ? "super_admin" : profile?.grupo_permissao || "";
  const { data: notificacoes = [], isLoading: loadingNotif } = useNotificacoes(grupoNotif);
  const { data: colaboradores = [], isLoading: loadingColab } = useColaboradores();
  const updateStatus = useUpdateVagaStatus();

  const isDiretoria = profile?.super_admin || profile?.grupo_permissao === "Diretoria";

  /* KPIs */
  const activeVagas = useMemo(() => vagas.filter((v) => !(v as Record<string, unknown>).excluida), [vagas]);
  
  const kpis = useMemo(() => {
    const vagasAbertas = activeVagas.filter((v) => v.status === "Aprovada").length;
    const aguardando = activeVagas.filter((v) => v.status === "Aguardando Aprovação").length;
    const emAnalise = activeVagas.filter((v) => v.status_candidato === "Em análise").length;
    const aprovados = activeVagas.filter((v) => v.status_candidato === "Aprovado").length;
    const reprovados = activeVagas.filter((v) => v.status_candidato === "Reprovado").length;
    return { vagasAbertas, aguardando, emAnalise, aprovados, reprovados };
  }, [activeVagas]);

  /* Últimas vagas */
  const vagasRecentes = useMemo(() => activeVagas.slice(0, 5), [activeVagas]);

  /* Vagas aguardando aprovação */
  const vagasAguardando = useMemo(
    () => activeVagas.filter((v) => v.status === "Aguardando Aprovação").slice(0, 10),
    [activeVagas]
  );

  /* Candidatos recentes */
  const candidatosRecentes = useMemo(
    () =>
      [...activeVagas]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [activeVagas]
  );

  /* Atividades recentes (notificações) */
  const atividadesRecentes = useMemo(() => notificacoes.slice(0, 8), [notificacoes]);

  /* Aniversariantes */
  const aniversariantesDoDia = useMemo(
    () => colaboradores.filter((c) => isBirthdayToday(c.data_nascimento)),
    [colaboradores]
  );

  const aniversariantesDoMes = useMemo(
    () =>
      colaboradores
        .filter((c) => isBirthdayThisMonth(c.data_nascimento))
        .sort((a, b) => {
          const dayA = new Date(a.data_nascimento + "T00:00:00").getDate();
          const dayB = new Date(b.data_nascimento + "T00:00:00").getDate();
          return dayA - dayB;
        }),
    [colaboradores]
  );

  const handleAprovar = (id: string) => {
    updateStatus.mutate(
      { id, status: "Aprovada" },
      { onSuccess: () => toast.success("Vaga aprovada com sucesso.") }
    );
  };

  const handleReprovar = (id: string) => {
    updateStatus.mutate(
      { id, status: "Reprovada" },
      { onSuccess: () => toast.success("Vaga reprovada.") }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">
          Bem-vindo, {(() => {
            const parts = (profile?.nome || "Usuário").trim().split(/\s+/);
            if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
            return parts[0];
          })()}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Painel de controle do sistema</p>
      </div>

      {/* ── Linha 1: KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Briefcase} title="Vagas Abertas" value={kpis.vagasAbertas} color="bg-primary/10 text-primary" />
        <KpiCard icon={Clock} title="Aguardando Aprovação" value={kpis.aguardando} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={UserSearch} title="Candidatos em Análise" value={kpis.emAnalise} color="bg-blue-100 text-blue-600" />
        <KpiCard icon={UserCheck} title="Candidatos Aprovados" value={kpis.aprovados} color="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={UserX} title="Candidatos Reprovados" value={kpis.reprovados} color="bg-red-100 text-red-600" />
      </div>

      {/* ── Aniversariantes ───────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            🎉 Aniversariantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aniversariantes do dia */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">🎉 Aniversariantes de Hoje</h4>
            {aniversariantesDoDia.length === 0 ? (
              <p className="text-sm text-muted-foreground">Hoje não há aniversariantes.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {aniversariantesDoDia.map((c) => (
                  <div key={c.id} className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm font-semibold text-foreground">{c.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">Cargo: {c.cargo}</p>
                    <p className="text-xs text-muted-foreground">Contrato: {c.centro_custo}</p>
                    <p className="text-xs text-muted-foreground">Site: {c.site_contrato}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Aniversariantes do mês */}
          {aniversariantesDoMes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Aniversariantes do Mês</h4>
              <div className="space-y-1">
                {aniversariantesDoMes.map((c) => {
                  const day = c.data_nascimento
                    ? String(new Date(c.data_nascimento + "T00:00:00").getDate()).padStart(2, "0")
                    : "--";
                  return (
                    <p key={c.id} className="text-sm text-muted-foreground">
                      {day} – {c.nome} – {c.cargo}
                    </p>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Minhas Pendências ─────────────────────────────────────── */}
      <PainelPendencias profile={profile} vagas={vagas} />
      {/* ── Linha 2: Vagas recentes + Aprovação ───────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Últimas Vagas Criadas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Últimas Vagas Criadas</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº</TableHead>
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Criação</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasRecentes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma vaga encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  vagasRecentes.map((v) => (
                    <TableRow
                      key={v.id}
                      className="cursor-pointer"
                      onClick={() => navigate("/rh/aprovacao-vaga")}
                    >
                      <TableCell className="font-mono text-xs text-primary">{(v as any).numero_vaga || "—"}</TableCell>
                      <TableCell className="font-medium">{v.cargo}</TableCell>
                      <TableCell>{v.centro_custo_nome}</TableCell>
                      <TableCell>{formatDate(v.created_at)}</TableCell>
                      <TableCell>{vagaStatusBadge(v.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Vagas aguardando aprovação */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Vagas Aguardando Aprovação</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Criação</TableHead>
                  {isDiretoria && <TableHead className="w-32">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {vagasAguardando.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isDiretoria ? 4 : 3} className="text-center text-muted-foreground">
                      Nenhuma vaga aguardando aprovação.
                    </TableCell>
                  </TableRow>
                ) : (
                  vagasAguardando.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.cargo}</TableCell>
                      <TableCell>{v.centro_custo_nome}</TableCell>
                      <TableCell>{formatDate(v.created_at)}</TableCell>
                      {isDiretoria && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[hsl(var(--success))] hover:text-[hsl(var(--success))]"
                              onClick={() => handleAprovar(v.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" /> Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleReprovar(v.id)}
                            >
                              <XCircle className="h-4 w-4 mr-1" /> Reprovar
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* ── Linha 3: Candidatos + Atividades ──────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Candidatos recentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Candidatos Recentes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidatosRecentes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum candidato encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  candidatosRecentes.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.nome_candidato}</TableCell>
                      <TableCell>{v.cargo}</TableCell>
                      <TableCell>{candidatoStatusBadge(v.status_candidato)}</TableCell>
                      <TableCell>{formatDate(v.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Atividades recentes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              Atividades Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atividadesRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade recente.
              </p>
            ) : (
              <div className="space-y-3">
                {atividadesRecentes.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 rounded-md border border-border p-3"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.mensagem}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDateTime(n.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
