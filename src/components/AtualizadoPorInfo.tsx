import { RefreshCw } from "lucide-react";

interface AtualizadoPorInfoProps {
  atualizadoPor?: string | null;
  atualizadoEm?: string | null;
  className?: string;
}

export function AtualizadoPorInfo({ atualizadoPor, atualizadoEm, className = "" }: AtualizadoPorInfoProps) {
  if (!atualizadoPor && !atualizadoEm) return null;

  const dataFormatada = atualizadoEm
    ? new Date(atualizadoEm).toLocaleDateString("pt-BR")
    : null;
  const horaFormatada = atualizadoEm
    ? new Date(atualizadoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`flex items-start gap-2 text-xs text-muted-foreground ${className}`}>
      <RefreshCw className="h-3.5 w-3.5 mt-0.5 shrink-0" />
      <div>
        {atualizadoPor && <span>Última atualização por: <strong className="text-foreground">{atualizadoPor}</strong></span>}
        {dataFormatada && (
          <span className="ml-1">
            — {dataFormatada} às {horaFormatada}
          </span>
        )}
      </div>
    </div>
  );
}
