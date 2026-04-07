import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Colaborador {
  id: string;
  vaga_id: string | null;
  nome: string;
  cargo: string;
  centro_custo: string;
  site_contrato: string;
  data_admissao: string;
  data_nascimento: string | null;
  telefone: string | null;
  status: string;
  data_desligamento: string | null;
  created_at: string;
  updated_at: string;
}

export interface ColaboradorHistorico {
  id: string;
  colaborador_id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  motivo: string;
  alterado_por: string;
  created_at: string;
}

export function useColaboradores() {
  return useQuery({
    queryKey: ["colaboradores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*")
        .order("nome", { ascending: true });
      if (error) throw error;
      return data as Colaborador[];
    },
  });
}

export function useColaboradorHistorico(colaboradorId: string | null) {
  return useQuery({
    queryKey: ["colaboradores_historico", colaboradorId],
    enabled: !!colaboradorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores_historico")
        .select("*")
        .eq("colaborador_id", colaboradorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ColaboradorHistorico[];
    },
  });
}

export function useUpdateColaborador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
      historico,
    }: {
      id: string;
      updates: Record<string, unknown>;
      historico: Array<{
        colaborador_id: string;
        campo_alterado: string;
        valor_anterior: string | null;
        valor_novo: string | null;
        motivo: string;
        alterado_por: string;
      }>;
    }) => {
      const { error } = await supabase
        .from("colaboradores")
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;

      if (historico.length > 0) {
        const { error: hErr } = await supabase
          .from("colaboradores_historico")
          .insert(historico);
        if (hErr) throw hErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      queryClient.invalidateQueries({ queryKey: ["colaboradores_historico"] });
    },
  });
}
