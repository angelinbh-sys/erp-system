import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Frequencia {
  id: string;
  colaborador_id: string;
  data: string;
  status: string;
  observacao: string | null;
  registrado_por: string | null;
  registrado_por_id: string | null;
  created_at: string;
  updated_at: string;
}

export const STATUS_FREQUENCIA = [
  "Presente",
  "Falta Não Comunicada",
  "Falta Comunicada",
  "Atestado Médico ou Afastamento",
  "Férias",
  "Desligamento",
  "Feriado",
] as const;

export type StatusFrequencia = (typeof STATUS_FREQUENCIA)[number];

export function useFrequenciaByDate(data: string | null) {
  return useQuery({
    queryKey: ["frequencia", data],
    enabled: !!data,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("frequencia")
        .select("*")
        .eq("data", data!);
      if (error) throw error;
      return rows as Frequencia[];
    },
  });
}

export function useFrequenciaByRange(dataInicio: string | null, dataFim: string | null) {
  return useQuery({
    queryKey: ["frequencia_range", dataInicio, dataFim],
    enabled: !!dataInicio && !!dataFim,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frequencia")
        .select("*")
        .gte("data", dataInicio!)
        .lte("data", dataFim!);
      if (error) throw error;
      return data as Frequencia[];
    },
  });
}

export function useUpsertFrequencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      records: Array<{
        colaborador_id: string;
        data: string;
        status: string;
        observacao?: string | null;
        registrado_por?: string | null;
        registrado_por_id?: string | null;
      }>
    ) => {
      const { error } = await supabase
        .from("frequencia")
        .upsert(records as any, { onConflict: "colaborador_id,data" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencia"] });
      queryClient.invalidateQueries({ queryKey: ["frequencia_range"] });
    },
  });
}
