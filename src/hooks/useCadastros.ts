import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteContrato {
  id: string;
  nome: string;
}

export interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
  sites: SiteContrato[];
}

export interface Cargo {
  id: string;
  nome: string;
  descricao: string;
}

// ─── localStorage → Supabase migration (one-time) ──────────────────
let migrationAttempted = false;

async function migrateLocalStorageData() {
  if (migrationAttempted) return;
  migrationAttempted = true;

  try {
    const ccRaw = localStorage.getItem("erp_centros_custo");
    if (ccRaw) {
      const ccItems = JSON.parse(ccRaw) as CentroCusto[];
      if (Array.isArray(ccItems) && ccItems.length > 0) {
        const payload = ccItems.map((c) => ({
          nome: c.nome,
          codigo: c.codigo,
          sites: (c.sites ?? []) as unknown as object,
        }));
        const { error } = await supabase.from("centros_custo").insert(payload);
        if (!error) localStorage.removeItem("erp_centros_custo");
      } else {
        localStorage.removeItem("erp_centros_custo");
      }
    }
  } catch (e) {
    console.error("Erro ao migrar centros_custo:", e);
  }

  try {
    const cargosRaw = localStorage.getItem("erp_cargos");
    if (cargosRaw) {
      const cargosItems = JSON.parse(cargosRaw) as Cargo[];
      if (Array.isArray(cargosItems) && cargosItems.length > 0) {
        const payload = cargosItems.map((c) => ({
          nome: c.nome,
          descricao: c.descricao ?? "",
        }));
        const { error } = await supabase.from("cargos").insert(payload);
        if (!error) localStorage.removeItem("erp_cargos");
      } else {
        localStorage.removeItem("erp_cargos");
      }
    }
  } catch (e) {
    console.error("Erro ao migrar cargos:", e);
  }
}

function useOneTimeMigration() {
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    migrateLocalStorageData();
  }, []);
}

// ─── Centros de Custo ──────────────────────────────────────────────
export function useCentrosCusto() {
  const queryClient = useQueryClient();
  useOneTimeMigration();

  const { data: items = [] } = useQuery<CentroCusto[]>({
    queryKey: ["centros_custo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("centros_custo")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        nome: row.nome,
        codigo: row.codigo,
        sites: Array.isArray(row.sites) ? (row.sites as SiteContrato[]) : [],
      }));
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["centros_custo"] });

  const addMutation = useMutation({
    mutationFn: async (item: Omit<CentroCusto, "id">) => {
      const { error } = await supabase.from("centros_custo").insert({
        nome: item.nome,
        codigo: item.codigo,
        sites: (item.sites ?? []) as unknown as object,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<CentroCusto, "id"> }) => {
      const { error } = await supabase
        .from("centros_custo")
        .update({
          nome: data.nome,
          codigo: data.codigo,
          sites: (data.sites ?? []) as unknown as object,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("centros_custo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const add = (item: Omit<CentroCusto, "id">) => addMutation.mutate(item);
  const update = (id: string, data: Omit<CentroCusto, "id">) =>
    updateMutation.mutate({ id, data });
  const remove = (id: string) => removeMutation.mutate(id);

  // Compatibility: setItems((prev) => next) — diff only `sites` changes per row.
  const setItems = async (updater: (prev: CentroCusto[]) => CentroCusto[]) => {
    const prev = items;
    const next = updater(prev);
    const changed = next.filter((n) => {
      const before = prev.find((p) => p.id === n.id);
      if (!before) return false;
      return JSON.stringify(before.sites) !== JSON.stringify(n.sites);
    });
    if (changed.length === 0) return;
    await Promise.all(
      changed.map((c) =>
        supabase
          .from("centros_custo")
          .update({ sites: (c.sites ?? []) as unknown as object })
          .eq("id", c.id),
      ),
    );
    invalidate();
  };

  return { items, add, update, remove, setItems };
}

// ─── Cargos ────────────────────────────────────────────────────────
export function useCargos() {
  const queryClient = useQueryClient();
  useOneTimeMigration();

  const { data: items = [] } = useQuery<Cargo[]>({
    queryKey: ["cargos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("*")
        .order("nome");
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        nome: row.nome,
        descricao: row.descricao ?? "",
      }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cargos"] });

  const addMutation = useMutation({
    mutationFn: async (item: Omit<Cargo, "id">) => {
      const { error } = await supabase.from("cargos").insert({
        nome: item.nome,
        descricao: item.descricao ?? "",
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Omit<Cargo, "id"> }) => {
      const { error } = await supabase
        .from("cargos")
        .update({ nome: data.nome, descricao: data.descricao ?? "" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cargos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const add = (item: Omit<Cargo, "id">) => addMutation.mutate(item);
  const update = (id: string, data: Omit<Cargo, "id">) =>
    updateMutation.mutate({ id, data });
  const remove = (id: string) => removeMutation.mutate(id);

  const setItems = (_updater: (prev: Cargo[]) => Cargo[]) => {
    // Não usado para cargos; mantido por compatibilidade de assinatura.
  };

  return { items, add, update, remove, setItems };
}
