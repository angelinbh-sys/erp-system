import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganogramaNode {
  id: string;
  contrato_id: string;
  colaborador_id: string | null;
  cargo: string;
  nome_colaborador: string;
  superior_id: string | null;
  quantidade: number;
  observacao: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrganograma(contratoId?: string) {
  const queryClient = useQueryClient();

  const nodesQuery = useQuery({
    queryKey: ["organograma", contratoId],
    queryFn: async () => {
      let query = supabase
        .from("organograma_nodes")
        .select("*")
        .order("created_at", { ascending: true });

      if (contratoId) {
        query = query.eq("contrato_id", contratoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data as any[]).map((d) => ({
        ...d,
        quantidade: d.quantidade ?? 1,
        observacao: d.observacao ?? null,
      })) as OrganogramaNode[];
    },
    enabled: !!contratoId,
  });

  const createNode = useMutation({
    mutationFn: async (node: Omit<OrganogramaNode, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("organograma_nodes")
        .insert(node as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as OrganogramaNode;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organograma"] }),
  });

  const updateNode = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<OrganogramaNode> & { id: string }) => {
      const { data, error } = await supabase
        .from("organograma_nodes")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as OrganogramaNode;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organograma"] }),
  });

  const deleteNode = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("organograma_nodes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["organograma"] }),
  });

  return { nodesQuery, createNode, updateNode, deleteNode };
}
