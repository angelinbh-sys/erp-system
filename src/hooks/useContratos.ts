import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Contrato {
  id: string;
  numero_contrato: string;
  cliente: string;
  projeto_obra: string;
  valor_contrato: number;
  data_inicio: string;
  data_termino: string;
  responsavel: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useContratos() {
  const queryClient = useQueryClient();

  const contratosQuery = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Contrato[];
    },
  });

  const createContrato = useMutation({
    mutationFn: async (contrato: Omit<Contrato, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("contratos").insert(contrato).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contratos"] }),
  });

  const updateContrato = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Contrato> & { id: string }) => {
      const { data, error } = await supabase.from("contratos").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contratos"] }),
  });

  const deleteContrato = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contratos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contratos"] }),
  });

  return { contratosQuery, createContrato, updateContrato, deleteContrato };
}
