import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Notificacao = Tables<"notificacoes">;

export function useNotificacoes() {
  return useQuery({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notificacao[];
    },
  });
}

export function useNotificacoesNaoLidas() {
  return useQuery({
    queryKey: ["notificacoes", "nao-lidas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("lida", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Notificacao[];
    },
  });
}

export function useCreateNotificacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notif: { titulo: string; mensagem: string; tipo?: string; link?: string; vaga_id?: string }) => {
      const { error } = await supabase.from("notificacoes").insert(notif);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}

export function useMarcarLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}
