import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatFirstLastName } from "@/utils/formatName";

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  user_name: string;
  created_at: string;
  modulo: string;
  pagina: string;
  acao: string;
  registro_id: string | null;
  registro_ref: string | null;
  descricao: string;
  motivo: string | null;
  dados_extras: Record<string, unknown> | null;
}

export interface LogAuditParams {
  modulo: string;
  pagina: string;
  acao: string;
  descricao: string;
  registro_id?: string;
  registro_ref?: string;
  motivo?: string;
  dados_extras?: Record<string, unknown>;
}

export function useAuditLog() {
  const { user, profile } = useAuthContext();

  const logAction = useCallback(
    async (params: LogAuditParams) => {
      try {
        await supabase.from("audit_logs" as any).insert({
          user_id: user?.id || null,
          user_name: formatFirstLastName(profile?.nome) || "Sistema",
          modulo: params.modulo,
          pagina: params.pagina,
          acao: params.acao,
          descricao: params.descricao,
          registro_id: params.registro_id || null,
          registro_ref: params.registro_ref || null,
          motivo: params.motivo || null,
          dados_extras: params.dados_extras || null,
        } as any);
      } catch (err) {
        console.error("Erro ao registrar auditoria:", err);
      }
    },
    [user, profile]
  );

  return { logAction };
}

export interface AuditLogFilters {
  startDate?: string;
  endDate?: string;
  usuario?: string;
  modulo?: string;
  pagina?: string;
  acao?: string;
}

export const AUDIT_LOG_PAGE_SIZE = 50;

export function useAuditLogs(filters: AuditLogFilters, page: number = 1) {
  return useQuery({
    queryKey: ["audit_logs", filters, page],
    queryFn: async () => {
      const from = (page - 1) * AUDIT_LOG_PAGE_SIZE;
      const to = page * AUDIT_LOG_PAGE_SIZE - 1;

      let query = (supabase.from("audit_logs" as any) as any)
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (filters.startDate) query = query.gte("created_at", `${filters.startDate}T00:00:00`);
      if (filters.endDate) query = query.lte("created_at", `${filters.endDate}T23:59:59`);
      if (filters.usuario) query = query.ilike("user_name", `%${filters.usuario}%`);
      if (filters.modulo && filters.modulo !== "__all__") query = query.eq("modulo", filters.modulo);
      if (filters.pagina) query = query.ilike("pagina", `%${filters.pagina}%`);
      if (filters.acao) query = query.ilike("acao", `%${filters.acao}%`);

      const { data, error, count } = await query;
      if (error) throw error;
      return {
        rows: (data || []) as unknown as AuditLogEntry[],
        total: count ?? 0,
      };
    },
  });
}

export function useRecordAuditLogs(registroId: string | null) {
  return useQuery({
    queryKey: ["audit_logs_record", registroId],
    enabled: !!registroId,
    queryFn: async () => {
      const { data, error } = await (supabase.from("audit_logs" as any) as any)
        .select("*")
        .eq("registro_id", registroId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as AuditLogEntry[];
    },
  });
}
