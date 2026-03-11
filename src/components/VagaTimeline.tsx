import { Check, Clock, Undo2, Circle, Stethoscope, ClipboardList, Users, FileText } from "lucide-react";
import type { VagaHistorico } from "@/hooks/useVagaHistorico";
import { STATUS_PROCESSO } from "@/utils/statusProcesso";

type StepStatus = "concluido" | "em_andamento" | "pendente" | "devolvido";

interface TimelineStep {
  label: string;
  status: StepStatus;
  responsavel?: string;
  data?: string;
  detalhe?: string;
  motivo?: string;
}

interface VagaTimelineProps {
  vaga: any;
  historico: VagaHistorico[];
}

function resolveSteps(vaga: any, historico: VagaHistorico[]): TimelineStep[] {
  const steps: TimelineStep[] = [];
  const sp = vaga.status_processo || "";

  // 1. Abertura da Vaga
  steps.push({
    label: "Abertura da Vaga",
    status: "concluido",
    data: new Date(vaga.created_at).toLocaleDateString("pt-BR"),
    responsavel: historico.find((h) => h.acao.includes("Reenviada"))?.usuario_nome || "RH",
  });

  const devolucoes = historico.filter((h) => h.acao.includes("Devolvida"));
  const cancelada = sp === STATUS_PROCESSO.VAGA_CANCELADA;

  if (cancelada) {
    steps.push({ label: "Vaga Cancelada", status: "devolvido", motivo: historico.find((h) => h.acao.includes("cancelada"))?.motivo || undefined });
    return steps;
  }

  // 2. Aprovação da Diretoria
  if (sp === STATUS_PROCESSO.REPROVADO_DIRETORIA || vaga.status === "Reprovada") {
    steps.push({ label: "Aprovação da Diretoria", status: "devolvido", detalhe: "Reprovada", motivo: vaga.observacao_reprovacao || undefined });
  } else if ([STATUS_PROCESSO.EM_ANDAMENTO_SESMT, STATUS_PROCESSO.AGUARDANDO_ADMISSAO, STATUS_PROCESSO.ADMISSAO_EM_ANDAMENTO, STATUS_PROCESSO.ADMITIDO, STATUS_PROCESSO.EFETIVADO].includes(sp) || vaga.status === "Aprovada") {
    steps.push({ label: "Aprovação da Diretoria", status: "concluido", detalhe: "Aprovada" });
  } else if (sp === STATUS_PROCESSO.DEVOLVIDO_RH) {
    const lastDev = devolucoes.filter((d) => d.acao.includes("SESMT")).pop();
    steps.push({ label: "Aprovação da Diretoria", status: "concluido", detalhe: "Aprovada anteriormente" });
  } else if (sp === STATUS_PROCESSO.AGUARDANDO_DIRETORIA || vaga.status === "Aguardando Aprovação") {
    steps.push({ label: "Aprovação da Diretoria", status: "em_andamento" });
  } else {
    steps.push({ label: "Aprovação da Diretoria", status: "pendente" });
  }

  // 3. SESMT
  if (sp === STATUS_PROCESSO.DEVOLVIDO_RH) {
    const lastDevolucao = devolucoes.filter((d) => d.acao.includes("SESMT")).pop();
    steps.push({
      label: "SESMT – Agendamento de ASO", status: "devolvido", detalhe: "Devolvida pelo SESMT",
      responsavel: lastDevolucao?.usuario_nome, data: lastDevolucao ? new Date(lastDevolucao.created_at).toLocaleDateString("pt-BR") : undefined,
      motivo: lastDevolucao?.motivo || undefined,
    });
  } else if ([STATUS_PROCESSO.AGUARDANDO_ADMISSAO, STATUS_PROCESSO.ADMISSAO_EM_ANDAMENTO, STATUS_PROCESSO.ADMITIDO, STATUS_PROCESSO.EFETIVADO].includes(sp) || vaga.enviado_admissao) {
    steps.push({ label: "SESMT – Agendamento de ASO", status: "concluido", data: vaga.enviado_admissao_at ? new Date(vaga.enviado_admissao_at).toLocaleDateString("pt-BR") : undefined });
  } else if (sp === STATUS_PROCESSO.EM_ANDAMENTO_SESMT || (vaga.status === "Aprovada" && !vaga.enviado_admissao)) {
    steps.push({ label: "SESMT – Agendamento de ASO", status: "em_andamento", detalhe: vaga.data_agendamento_aso ? `ASO agendado: ${vaga.data_agendamento_aso}` : undefined });
  } else {
    steps.push({ label: "SESMT – Agendamento de ASO", status: "pendente" });
  }

  // 4. DP — Admissão
  if ([STATUS_PROCESSO.ADMITIDO, STATUS_PROCESSO.EFETIVADO].includes(sp)) {
    const admH = historico.find((h) => h.acao.includes("Admissão concluída"));
    steps.push({ label: "Departamento Pessoal – Admissão", status: "concluido", data: admH ? new Date(admH.created_at).toLocaleDateString("pt-BR") : undefined, responsavel: admH?.usuario_nome });
  } else if ([STATUS_PROCESSO.AGUARDANDO_ADMISSAO, STATUS_PROCESSO.ADMISSAO_EM_ANDAMENTO].includes(sp) || vaga.enviado_admissao) {
    steps.push({ label: "Departamento Pessoal – Admissão", status: "em_andamento" });
  } else {
    steps.push({ label: "Departamento Pessoal – Admissão", status: "pendente" });
  }

  // 5. Efetivo
  if (sp === STATUS_PROCESSO.EFETIVADO) {
    steps.push({ label: "Efetivo", status: "concluido" });
  } else if (sp === STATUS_PROCESSO.ADMITIDO) {
    steps.push({ label: "Efetivo", status: "em_andamento" });
  } else {
    steps.push({ label: "Efetivo", status: "pendente" });
  }

  return steps;
}

const statusStyles: Record<StepStatus, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  concluido: { bg: "bg-green-100", border: "border-green-400", text: "text-green-800", icon: <Check className="h-4 w-4" /> },
  em_andamento: { bg: "bg-blue-100", border: "border-blue-400", text: "text-blue-800", icon: <Clock className="h-4 w-4" /> },
  pendente: { bg: "bg-muted", border: "border-muted-foreground/30", text: "text-muted-foreground", icon: <Circle className="h-4 w-4" /> },
  devolvido: { bg: "bg-red-100", border: "border-red-400", text: "text-red-800", icon: <Undo2 className="h-4 w-4" /> },
};

const statusLabels: Record<StepStatus, string> = {
  concluido: "Concluído", em_andamento: "Em andamento", pendente: "Pendente", devolvido: "Devolvido",
};

export default function VagaTimeline({ vaga, historico }: VagaTimelineProps) {
  const steps = resolveSteps(vaga, historico);

  return (
    <div className="space-y-1">
      <h4 className="text-sm font-semibold text-foreground mb-3">Fluxo da Vaga</h4>
      <div className="relative">
        {steps.map((step, idx) => {
          const style = statusStyles[step.status];
          const isLast = idx === steps.length - 1;
          return (
            <div key={idx} className="flex gap-3 relative">
              {!isLast && <div className="absolute left-[15px] top-[32px] bottom-0 w-0.5 bg-border" />}
              <div className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0 ${style.bg} ${style.border} ${style.text}`}>{style.icon}</div>
              <div className={`pb-4 flex-1 ${isLast ? "" : "mb-1"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>{statusLabels[step.status]}</span>
                </div>
                {(step.responsavel || step.data || step.detalhe) && (
                  <div className="mt-1 space-y-0.5">
                    {step.responsavel && <p className="text-xs text-muted-foreground">Responsável: {step.responsavel}</p>}
                    {step.data && <p className="text-xs text-muted-foreground">Data: {step.data}</p>}
                    {step.detalhe && <p className="text-xs text-muted-foreground">{step.detalhe}</p>}
                  </div>
                )}
                {step.motivo && (
                  <div className="mt-1 p-2 rounded bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700"><strong>Motivo:</strong> {step.motivo}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
