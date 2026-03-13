import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Medicao {
  id: string;
  contrato_id: string;
  data_inicio: string;
  data_fim: string;
  descricao: string;
  valor_medido: number;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export function useMedicoes(contratoId?: string) {
  const queryClient = useQueryClient();

  const medicoesQuery = useQuery({
    queryKey: ["medicoes", contratoId],
    queryFn: async () => {
      let query = supabase.from("medicoes").select("*").order("data_inicio", { ascending: false });
      if (contratoId) query = query.eq("contrato_id", contratoId);
      const { data, error } = await query;
      if (error) throw error;
      return data as Medicao[];
    },
  });

  const createMedicao = useMutation({
    mutationFn: async (medicao: Omit<Medicao, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("medicoes").insert(medicao).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicoes"] });
    },
  });

  const deleteMedicao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medicoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["medicoes"] });
    },
  });

  return { medicoesQuery, createMedicao, deleteMedicao };
}
