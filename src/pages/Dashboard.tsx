import { useMemo } from "react";
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
import { toast } from "sonner";

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

/* ─── Dashboard ─────────────────────────────────────────────────── */
const Dashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const { data: vagas = [] } = useVagas();
  const { data: notificacoes = [] } = useNotificacoes();
  const updateStatus = useUpdateVagaStatus();

  const isDiretoria = profile?.grupo_permissao === "Diretoria";

  /* KPIs */
  const kpis = useMemo(() => {
    const vagasAbertas = vagas.filter((v) => v.status === "Aprovada").length;
    const aguardando = vagas.filter((v) => v.status === "Aguardando Aprovação").length;
    const emAnalise = vagas.filter((v) => v.status_candidato === "Em análise").length;
    const aprovados = vagas.filter((v) => v.status_candidato === "Aprovado").length;
    const reprovados = vagas.filter((v) => v.status_candidato === "Reprovado").length;
    return { vagasAbertas, aguardando, emAnalise, aprovados, reprovados };
  }, [vagas]);

  /* Últimas vagas */
  const vagasRecentes = useMemo(() => vagas.slice(0, 5), [vagas]);

  /* Vagas aguardando aprovação */
  const vagasAguardando = useMemo(
    () => vagas.filter((v) => v.status === "Aguardando Aprovação").slice(0, 10),
    [vagas]
  );

  /* Candidatos recentes */
  const candidatosRecentes = useMemo(
    () =>
      [...vagas]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [vagas]
  );

  /* Atividades recentes (notificações) */
  const atividadesRecentes = useMemo(() => notificacoes.slice(0, 8), [notificacoes]);

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
      <h2 className="font-heading text-2xl font-bold text-foreground">Dashboard</h2>

      {/* ── Linha 1: KPIs ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard icon={Briefcase} title="Vagas Abertas" value={kpis.vagasAbertas} color="bg-primary/10 text-primary" />
        <KpiCard icon={Clock} title="Aguardando Aprovação" value={kpis.aguardando} color="bg-amber-100 text-amber-600" />
        <KpiCard icon={UserSearch} title="Candidatos em Análise" value={kpis.emAnalise} color="bg-blue-100 text-blue-600" />
        <KpiCard icon={UserCheck} title="Candidatos Aprovados" value={kpis.aprovados} color="bg-emerald-100 text-emerald-600" />
        <KpiCard icon={UserX} title="Candidatos Reprovados" value={kpis.reprovados} color="bg-red-100 text-red-600" />
      </div>

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
                  <TableHead>Cargo / Função</TableHead>
                  <TableHead>Centro de Custo</TableHead>
                  <TableHead>Site / Contrato</TableHead>
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
                      onClick={() => navigate("/rh/abertura-de-vaga")}
                    >
                      <TableCell className="font-medium">{v.cargo}</TableCell>
                      <TableCell>{v.centro_custo_nome}</TableCell>
                      <TableCell>{v.site_contrato}</TableCell>
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
