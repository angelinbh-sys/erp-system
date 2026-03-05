import { useState, useEffect, useCallback } from "react";

export interface CentroCusto {
  id: string;
  nome: string;
  codigo: string;
}

export interface SiteContrato {
  id: string;
  nome: string;
}

export interface Cargo {
  id: string;
  nome: string;
  descricao: string;
}

function useLocalStorage<T extends { id: string }>(key: string) {
  const [items, setItemsState] = useState<T[]>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [key, items]);

  const add = useCallback((item: Omit<T, "id">) => {
    setItemsState((prev) => [...prev, { ...item, id: crypto.randomUUID() } as T]);
  }, []);

  const update = useCallback((id: string, data: Omit<T, "id">) => {
    setItemsState((prev) => prev.map((i) => (i.id === id ? ({ ...data, id } as T) : i)));
  }, []);

  const remove = useCallback((id: string) => {
    setItemsState((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, add, update, remove };
}

export function useCentrosCusto() {
  return useLocalStorage<CentroCusto>("erp_centros_custo");
}

export function useSitesContrato() {
  return useLocalStorage<SiteContrato>("erp_tipos_contrato");
}

export function useCargos() {
  return useLocalStorage<Cargo>("erp_cargos");
}

// Keep backward compatibility alias
export function useTiposContrato() {
  return useSitesContrato();
}
