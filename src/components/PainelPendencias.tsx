import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Gavel,
  Stethoscope,
  UserPlus,
  RotateCcw,
  ChevronRight,
  CheckCircle,
  XCircle,
  Eye,
  Pencil,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_PROCESSO, STATUS_PROCESSO_CONFIG } from "@/utils/statusProcesso";
import type { Vaga } from "@/hooks/useVagas";
import type { Profile } from "@/hooks/useAuth";

/* ─── Types ─────────────────────────────────────────────────────── */
interface PendenciaCard {
  id: string;
  title: string;
  icon: React.ElementType;
  color: "blue" | "red" | "yellow" | "green";
  count: number;
  link: string;
  vagas: Vaga[];
}

const COLOR_MAP = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-600 text-white",
    hoverBorder: "hover:border-blue-400",
  },
  red: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
    icon: "text-red-600 dark:text-red-400",
    badge: "bg-red-600 text-white",
    hoverBorder: "hover:border-red-400",
  },
  yellow: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-600 text-white",
    hoverBorder: "hover:border-amber-400",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-600 text-white",
    hoverBorder: "hover:border-emerald-400",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

function statusBadge(status: string) {
  const cfg = STATUS_PROCESSO_CONFIG[status];
  if (!cfg) return <Badge variant="secondary">{status}</Badge>;
  return <Badge className={`${cfg.className} border text-xs`}>{cfg.label}</Badge>;
}

/* ─── Component ─────────────────────────────────────────────────── */
interface Props {
  profile: Profile | null;
  vagas: Vaga[];
}

export default function PainelPendencias({ profile, vagas }: Props) {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState<PendenciaCard | null>(null);

  const grupo = (profile?.grupo_permissao || "").toLowerCase();
  const isSuper = !!profile?.super_admin;
  const userId = profile?.user_id;

  const activeVagas = useMemo(
    () => vagas.filter((v) => !v.excluida && v.status_processo !== STATUS_PROCESSO.VAGA_CANCELADA),
    [vagas]
  );

  const cards = useMemo(() => {
    const result: PendenciaCard[] = [];

    // Diretoria — Aprovações Pendentes
    if (isSuper || grupo === "diretoria") {
      const items = activeVagas.filter((v) => v.status_processo === STATUS_PROCESSO.AGUARDANDO_DIRETORIA);
      result.push({
        id: "aprovacoes",
        title: "Aprovações Pendentes",
        icon: Gavel,
        color: items.length > 0 ? "blue" : "green",
        count: items.length,
        link: "/rh/aprovacao-vaga",
        vagas: items,
      });
    }

    // SESMT — Pendências do SESMT
    if (isSuper || grupo === "sesmt") {
      const items = activeVagas.filter(
        (v) =>
          v.status_processo === STATUS_PROCESSO.APROVADO_DIRETORIA ||
          v.status_processo === STATUS_PROCESSO.EM_ANDAMENTO_SESMT
      );
      const missingData = items.filter(
        (v) => !v.data_agendamento_aso || !v.data_entrega_aso || !v.resultado_aso_path
      );
      result.push({
        id: "sesmt",
        title: "Pendências do SESMT",
        icon: Stethoscope,
        color: items.length === 0 ? "green" : missingData.length > 0 ? "yellow" : "blue",
        count: items.length,
        link: "/sesmt/agendamento-aso",
        vagas: items,
      });
    }

    // DP — Admissões Pendentes
    if (isSuper || grupo === "dep. pessoal" || grupo === "departamento pessoal" || grupo === "dp") {
      const items = activeVagas.filter(
        (v) =>
          v.status_processo === STATUS_PROCESSO.AGUARDANDO_ADMISSAO ||
          v.status_processo === STATUS_PROCESSO.ADMISSAO_EM_ANDAMENTO
      );
      result.push({
        id: "admissoes",
        title: "Admissões Pendentes",
        icon: UserPlus,
        color: items.length > 0 ? "blue" : "green",
        count: items.length,
        link: "/departamento-pessoal/admissao",
        vagas: items,
      });
    }

    // RH / Criador — Solicitações devolvidas
    if (isSuper || grupo === "rh" || grupo === "recursos humanos") {
      const items = activeVagas.filter(
        (v) =>
          (v.status_processo === STATUS_PROCESSO.DEVOLVIDO_RH ||
            v.status_processo === STATUS_PROCESSO.REPROVADO_DIRETORIA) &&
          (isSuper || grupo === "rh" || grupo === "recursos humanos" || v.criado_por === userId)
      );
      result.push({
        id: "devolvidas",
        title: "Solicitações Devolvidas",
        icon: RotateCcw,
        color: items.length > 0 ? "red" : "green",
        count: items.length,
        link: "/rh/solicitacao-de-vaga",
        vagas: items,
      });
    }

    return result;
  }, [activeVagas, isSuper, grupo, userId]);

  return (
    <>
      <div>
        <h3 className="font-heading text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          📋 Minhas Pendências
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => {
            const colors = COLOR_MAP[card.color];
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                className={`${card.count > 0 ? "cursor-pointer" : ""} border-2 transition-all ${colors.bg} ${colors.border} ${colors.hoverBorder} hover:shadow-md`}
                onClick={() => card.count > 0 && setSelectedCard(card)}
              >
                <CardContent className="p-5 flex flex-col items-center text-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg}`}>
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <p className="text-sm font-medium text-foreground">{card.title}</p>
                  {card.count > 0 ? (
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${colors.badge}`}>
                      {card.count}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium">Sem pendências</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedCard} onOpenChange={(o) => !o && setSelectedCard(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCard && (() => {
                const Icon = selectedCard.icon;
                const colors = COLOR_MAP[selectedCard.color];
                return <Icon className={`h-5 w-5 ${colors.icon}`} />;
              })()}
              {selectedCard?.title} ({selectedCard?.count})
            </DialogTitle>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Vaga</TableHead>
                <TableHead>Candidato</TableHead>
                <TableHead>Cargo / Função</TableHead>
                <TableHead>Criado por</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedCard?.vagas.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-xs text-primary">{v.numero_vaga || "—"}</TableCell>
                  <TableCell className="font-medium">{v.nome_candidato}</TableCell>
                  <TableCell>{v.cargo}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{v.atualizado_por || "—"}</TableCell>
                  <TableCell className="text-xs">{formatDate(v.created_at)}</TableCell>
                  <TableCell>{statusBadge(v.status_processo)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSelectedCard(null);
                        navigate(selectedCard!.link);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const link = selectedCard?.link;
                setSelectedCard(null);
                if (link) navigate(link);
              }}
            >
              Abrir página completa <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
