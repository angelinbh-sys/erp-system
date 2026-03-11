import { useRecordAuditLogs, type AuditLogEntry } from "@/hooks/useAuditLog";
import { Clock, User } from "lucide-react";

interface HistoricoRegistroProps {
  registroId: string | null;
  className?: string;
}

export function HistoricoRegistro({ registroId, className = "" }: HistoricoRegistroProps) {
  const { data: logs = [], isLoading } = useRecordAuditLogs(registroId);

  if (!registroId) return null;

  return (
    <div className={`${className}`}>
      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Histórico do Registro
      </h4>
      {isLoading ? (
        <p className="text-xs text-muted-foreground">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhum registro de auditoria.</p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {logs.map((log: AuditLogEntry) => (
            <div key={log.id} className="flex items-start gap-2 text-xs border-l-2 border-primary/30 pl-3 py-1">
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium text-foreground">{log.user_name}</span>
                  <span className="text-muted-foreground">—</span>
                  <span className="text-muted-foreground">
                    {new Date(log.created_at).toLocaleDateString("pt-BR")}{" "}
                    {new Date(log.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-foreground mt-0.5">{log.descricao}</p>
                {log.motivo && (
                  <p className="text-muted-foreground italic mt-0.5">Motivo: {log.motivo}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
