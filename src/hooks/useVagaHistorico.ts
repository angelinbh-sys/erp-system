import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VagaHistorico {
  id: string;
  vaga_id: string;
  acao: string;
  usuario_nome: string;
  motivo: string | null;
  created_at: string;
}

export function useVagaHistorico(vagaId: string | null) {
  return useQuery({
    queryKey: ["vagas_historico", vagaId],
    enabled: !!vagaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vagas_historico" as any)
        .select("*")
        .eq("vaga_id", vagaId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as VagaHistorico[];
    },
  });
}
