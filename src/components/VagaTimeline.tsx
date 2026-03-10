import { Check, Clock, Undo2, Circle, Stethoscope, ClipboardList, Users, FileText } from "lucide-react";
import type { VagaHistorico } from "@/hooks/useVagaHistorico";

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

  // 1. Abertura da Vaga — always completed
  steps.push({
    label: "Abertura da Vaga",
    status: "concluido",
    data: new Date(vaga.created_at).toLocaleDateString("pt-BR"),
    responsavel: historico.find((h) => h.acao.includes("Reenviada"))?.usuario_nome || "RH",
  });

  // Check for devolution events to show in the timeline
  const devolucoes = historico.filter((h) => h.acao.includes("Devolvida"));

  // 2. Aprovação da Diretoria
  const isApproved = ["Aprovada", "Devolvida SESMT"].includes(vaga.status) || vaga.enviado_admissao;
  const isWaitingApproval = vaga.status === "Aguardando Aprovação";
  const isReprovada = vaga.status === "Reprovada";
  const isDevolvidaSesmt = vaga.status === "Devolvida SESMT";

  if (isReprovada) {
    steps.push({
      label: "Aprovação da Diretoria",
      status: "devolvido",
      detalhe: "Reprovada",
      motivo: vaga.observacao_reprovacao || undefined,
    });
  } else if (isApproved || vaga.status === "Aprovada") {
    steps.push({
      label: "Aprovação da Diretoria",
      status: "concluido",
      detalhe: "Aprovada",
    });
  } else if (isWaitingApproval) {
    steps.push({
      label: "Aprovação da Diretoria",
      status: "em_andamento",
    });
  } else {
    steps.push({
      label: "Aprovação da Diretoria",
      status: "pendente",
    });
  }

  // 3. SESMT — Agendamento de ASO
  if (isDevolvidaSesmt) {
    const lastDevolucao = devolucoes.filter((d) => d.acao.includes("SESMT")).pop();
    steps.push({
      label: "SESMT – Agendamento de ASO",
      status: "devolvido",
      detalhe: "Devolvida pelo SESMT",
      responsavel: lastDevolucao?.usuario_nome,
      data: lastDevolucao ? new Date(lastDevolucao.created_at).toLocaleDateString("pt-BR") : undefined,
      motivo: lastDevolucao?.motivo || undefined,
    });
  } else if (vaga.enviado_admissao) {
    steps.push({
      label: "SESMT – Agendamento de ASO",
      status: "concluido",
      data: vaga.enviado_admissao_at ? new Date(vaga.enviado_admissao_at).toLocaleDateString("pt-BR") : undefined,
    });
  } else if (vaga.status === "Aprovada" && !vaga.enviado_admissao) {
    steps.push({
      label: "SESMT – Agendamento de ASO",
      status: "em_andamento",
      detalhe: vaga.data_agendamento_aso ? `ASO agendado: ${vaga.data_agendamento_aso}` : undefined,
    });
  } else {
    steps.push({
      label: "SESMT – Agendamento de ASO",
      status: "pendente",
    });
  }

  // 4. DP — Admissão
  // Check if colaborador was created from this vaga
  const admissaoHistorico = historico.find((h) => h.acao.includes("Admissão") && !h.acao.includes("Enviado"));
  if (admissaoHistorico) {
    steps.push({
      label: "Departamento Pessoal – Admissão",
      status: "concluido",
      data: new Date(admissaoHistorico.created_at).toLocaleDateString("pt-BR"),
      responsavel: admissaoHistorico.usuario_nome,
    });
  } else if (vaga.enviado_admissao) {
    steps.push({
      label: "Departamento Pessoal – Admissão",
      status: "em_andamento",
    });
  } else {
    steps.push({
      label: "Departamento Pessoal – Admissão",
      status: "pendente",
    });
  }

  // 5. Efetivo
  const efetivoHistorico = historico.find((h) => h.acao.includes("Efetivo"));
  if (efetivoHistorico) {
    steps.push({
      label: "Efetivo",
      status: "concluido",
      data: new Date(efetivoHistorico.created_at).toLocaleDateString("pt-BR"),
    });
  } else {
    steps.push({
      label: "Efetivo",
      status: "pendente",
    });
  }

  return steps;
}

const statusStyles: Record<StepStatus, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  concluido: {
    bg: "bg-green-100",
    border: "border-green-400",
    text: "text-green-800",
    icon: <Check className="h-4 w-4" />,
  },
  em_andamento: {
    bg: "bg-blue-100",
    border: "border-blue-400",
    text: "text-blue-800",
    icon: <Clock className="h-4 w-4" />,
  },
  pendente: {
    bg: "bg-muted",
    border: "border-muted-foreground/30",
    text: "text-muted-foreground",
    icon: <Circle className="h-4 w-4" />,
  },
  devolvido: {
    bg: "bg-red-100",
    border: "border-red-400",
    text: "text-red-800",
    icon: <Undo2 className="h-4 w-4" />,
  },
};

const statusLabels: Record<StepStatus, string> = {
  concluido: "Concluído",
  em_andamento: "Em andamento",
  pendente: "Pendente",
  devolvido: "Devolvido",
};

const stepIcons: Record<string, React.ReactNode> = {
  "Abertura da Vaga": <FileText className="h-4 w-4" />,
  "Aprovação da Diretoria": <Users className="h-4 w-4" />,
  "SESMT – Agendamento de ASO": <Stethoscope className="h-4 w-4" />,
  "Departamento Pessoal – Admissão": <ClipboardList className="h-4 w-4" />,
  "Efetivo": <Check className="h-4 w-4" />,
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
              {/* Vertical line connector */}
              {!isLast && (
                <div className="absolute left-[15px] top-[32px] bottom-0 w-0.5 bg-border" />
              )}

              {/* Status circle */}
              <div
                className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full border-2 shrink-0 ${style.bg} ${style.border} ${style.text}`}
              >
                {style.icon}
              </div>

              {/* Content */}
              <div className={`pb-4 flex-1 ${isLast ? "" : "mb-1"}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{step.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.text} border ${style.border}`}>
                    {statusLabels[step.status]}
                  </span>
                </div>

                {(step.responsavel || step.data || step.detalhe) && (
                  <div className="mt-1 space-y-0.5">
                    {step.responsavel && (
                      <p className="text-xs text-muted-foreground">
                        Responsável: {step.responsavel}
                      </p>
                    )}
                    {step.data && (
                      <p className="text-xs text-muted-foreground">
                        Data: {step.data}
                      </p>
                    )}
                    {step.detalhe && (
                      <p className="text-xs text-muted-foreground">
                        {step.detalhe}
                      </p>
                    )}
                  </div>
                )}

                {step.motivo && (
                  <div className="mt-1 p-2 rounded bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700">
                      <strong>Motivo:</strong> {step.motivo}
                    </p>
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
