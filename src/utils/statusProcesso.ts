// Status do Processo — estados globais do fluxo de vagas
export const STATUS_PROCESSO = {
  RASCUNHO: "Rascunho",
  AGUARDANDO_DIRETORIA: "Aguardando Diretoria",
  REPROVADO_DIRETORIA: "Reprovado pela Diretoria",
  APROVADO_DIRETORIA: "Aprovado pela Diretoria",
  EM_ANDAMENTO_SESMT: "Em andamento no SESMT",
  DEVOLVIDO_RH: "Devolvido para RH",
  AGUARDANDO_ADMISSAO: "Aguardando Admissão",
  ADMISSAO_EM_ANDAMENTO: "Admissão em andamento",
  ADMITIDO: "Admitido",
  EFETIVADO: "Efetivado",
  VAGA_CANCELADA: "Vaga Cancelada",
} as const;

export type StatusProcesso = (typeof STATUS_PROCESSO)[keyof typeof STATUS_PROCESSO];

// Responsável automático por etapa
export const RESPONSAVEL_MAP: Record<string, string> = {
  [STATUS_PROCESSO.RASCUNHO]: "RH",
  [STATUS_PROCESSO.AGUARDANDO_DIRETORIA]: "Diretoria",
  [STATUS_PROCESSO.REPROVADO_DIRETORIA]: "RH",
  [STATUS_PROCESSO.APROVADO_DIRETORIA]: "SESMT",
  [STATUS_PROCESSO.EM_ANDAMENTO_SESMT]: "SESMT",
  [STATUS_PROCESSO.DEVOLVIDO_RH]: "RH",
  [STATUS_PROCESSO.AGUARDANDO_ADMISSAO]: "Dep. Pessoal",
  [STATUS_PROCESSO.ADMISSAO_EM_ANDAMENTO]: "Dep. Pessoal",
  [STATUS_PROCESSO.ADMITIDO]: "Dep. Pessoal",
  [STATUS_PROCESSO.EFETIVADO]: "—",
  [STATUS_PROCESSO.VAGA_CANCELADA]: "—",
};

export function getResponsavelEtapa(statusProcesso: string): string {
  return RESPONSAVEL_MAP[statusProcesso] || "—";
}

// Status visual config for badges
export const STATUS_PROCESSO_CONFIG: Record<string, { label: string; className: string }> = {
  [STATUS_PROCESSO.RASCUNHO]: { label: "Rascunho", className: "bg-muted text-muted-foreground border-muted-foreground/30" },
  [STATUS_PROCESSO.AGUARDANDO_DIRETORIA]: { label: "Aguardando Diretoria", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  [STATUS_PROCESSO.REPROVADO_DIRETORIA]: { label: "Reprovado pela Diretoria", className: "bg-red-100 text-red-800 border-red-300" },
  [STATUS_PROCESSO.APROVADO_DIRETORIA]: { label: "Aprovado pela Diretoria", className: "bg-green-100 text-green-800 border-green-300" },
  [STATUS_PROCESSO.EM_ANDAMENTO_SESMT]: { label: "Em andamento no SESMT", className: "bg-purple-100 text-purple-800 border-purple-300" },
  [STATUS_PROCESSO.DEVOLVIDO_RH]: { label: "Devolvido para RH", className: "bg-orange-100 text-orange-800 border-orange-300" },
  [STATUS_PROCESSO.AGUARDANDO_ADMISSAO]: { label: "Aguardando Admissão", className: "bg-blue-100 text-blue-800 border-blue-300" },
  [STATUS_PROCESSO.ADMISSAO_EM_ANDAMENTO]: { label: "Admissão em andamento", className: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  [STATUS_PROCESSO.ADMITIDO]: { label: "Admitido", className: "bg-teal-100 text-teal-800 border-teal-300" },
  [STATUS_PROCESSO.EFETIVADO]: { label: "Efetivado", className: "bg-green-100 text-green-800 border-green-300" },
};
