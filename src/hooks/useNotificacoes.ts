import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Notificacao = Tables<"notificacoes">;

export function useNotificacoes(grupoPermissao?: string) {
  return useQuery({
    queryKey: ["notificacoes", grupoPermissao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const all = data as Notificacao[];
      
      // Filter notifications by group relevance
      if (!grupoPermissao) return all;
      
      return all.filter((n) => {
        // If notification has a destinatario_grupo, only show to that group
        const dest = (n as any).destinatario_grupo;
        if (dest) {
          return dest.toLowerCase() === grupoPermissao.toLowerCase() || grupoPermissao.toLowerCase() === "super_admin";
        }
        return true; // Show notifications without a specific group
      });
    },
  });
}

export function useNotificacoesNaoLidas(grupoPermissao?: string) {
  return useQuery({
    queryKey: ["notificacoes", "nao-lidas", grupoPermissao],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("lida", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const all = data as Notificacao[];
      
      if (!grupoPermissao) return all;
      
      return all.filter((n) => {
        const dest = (n as any).destinatario_grupo;
        if (dest) {
          return dest.toLowerCase() === grupoPermissao.toLowerCase() || grupoPermissao.toLowerCase() === "super_admin";
        }
        return true;
      });
    },
  });
}

export function useCreateNotificacao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (notif: { titulo: string; mensagem: string; tipo?: string; link?: string; vaga_id?: string; destinatario_grupo?: string }) => {
      const { error } = await supabase.from("notificacoes").insert(notif as any);
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

export function useMarcarTodasLidas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("lida", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
    },
  });
}
