import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Vaga = Tables<"vagas">;
export type VagaInsert = TablesInsert<"vagas">;

export function useVagas(statusFilter?: string) {
  return useQuery({
    queryKey: ["vagas", statusFilter],
    queryFn: async () => {
      let query = supabase.from("vagas").select("*").order("created_at", { ascending: false });
      if (statusFilter) {
        query = query.eq("status", statusFilter);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Vaga[];
    },
  });
}

export function useCreateVaga() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vaga: VagaInsert) => {
      const { data, error } = await supabase.from("vagas").insert(vaga).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
    },
  });
}

export function useUpdateVagaStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, observacao }: { id: string; status: string; observacao?: string }) => {
      const update: Record<string, string> = { status };
      if (observacao !== undefined) update.observacao_reprovacao = observacao;
      const { error } = await supabase.from("vagas").update(update as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
    },
  });
}
