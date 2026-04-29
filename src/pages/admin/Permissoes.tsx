import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { Plus, Pencil, Trash2, Info, ChevronDown } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";

// ─── Structure: modules with pages ───────────────────────────────────
const MODULOS_PAGINAS = [
  {
    modulo: "Recursos Humanos",
    paginas: ["Gestão RH", "Solicitação de Vaga", "Aprovação de Vaga"],
  },
  {
    modulo: "Dep. Pessoal",
    paginas: ["Alteração de Função / Cargo", "Solicitação de Férias", "Admissão", "Efetivo"],
  },
  {
    modulo: "SESMT",
    paginas: ["Agendamento de ASO"],
  },
  { modulo: "Financeiro", paginas: ["Financeiro"] },
  { modulo: "Logística", paginas: ["Logística"] },
  { modulo: "Qualidade", paginas: ["Qualidade"] },
  {
    modulo: "Admin",
    paginas: ["Usuários", "Grupos de Permissão", "Log de Auditoria"],
  },
] as const;

const PERMISSOES = ["acesso", "visualizacao", "criacao", "edicao", "exclusao"] as const;
const PERMISSAO_LABELS: Record<string, string> = {
  acesso: "Acesso",
  visualizacao: "Visualização",
  criacao: "Criação",
  edicao: "Edição",
  exclusao: "Exclusão",
};

type PaginaPermissoes = Record<string, boolean>;
type GrupoPermissoes = Record<string, PaginaPermissoes>;

export interface GrupoPermissao {
  id: string;
  nome: string;
  permissoes: GrupoPermissoes;
}

function makeKey(modulo: string, pagina: string) {
  return `${modulo}::${pagina}`;
}

function criarPermissoesVazias(): GrupoPermissoes {
  const result: GrupoPermissoes = {};
  MODULOS_PAGINAS.forEach((mod) => {
    mod.paginas.forEach((pag) => {
      const key = makeKey(mod.modulo, pag);
      result[key] = {};
      PERMISSOES.forEach((p) => {
        result[key][p] = false;
      });
    });
  });
  return result;
}

function getHighestPermIndex(modPerms: PaginaPermissoes): number {
  for (let i = PERMISSOES.length - 1; i >= 0; i--) {
    if (modPerms[PERMISSOES[i]]) return i;
  }
  return -1;
}

// ─── localStorage → Supabase migration (one-time) ──────────────────
let migrationAttempted = false;

async function migrateLocalStorageData() {
  if (migrationAttempted) return;
  migrationAttempted = true;
  try {
    const raw = localStorage.getItem("erp_grupos_permissao");
    if (!raw) return;
    const items = JSON.parse(raw) as GrupoPermissao[];
    if (!Array.isArray(items) || items.length === 0) {
      localStorage.removeItem("erp_grupos_permissao");
      return;
    }
    const { count, error: countError } = await supabase
      .from("grupos_permissao" as any)
      .select("*", { count: "exact", head: true });
    if (countError) throw countError;
    if ((count ?? 0) === 0) {
      const payload = items.map((g) => ({
        nome: g.nome,
        permissoes: (g.permissoes ?? {}) as any,
      }));
      const { error } = await (supabase.from("grupos_permissao" as any) as any).insert(payload);
      if (!error) localStorage.removeItem("erp_grupos_permissao");
    } else {
      localStorage.removeItem("erp_grupos_permissao");
    }
  } catch (e) {
    console.error("Erro ao migrar grupos_permissao:", e);
  }
}

const AdminPermissoes = () => {
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    migrateLocalStorageData().then(() => {
      queryClient.invalidateQueries({ queryKey: ["grupos_permissao"] });
    });
  }, [queryClient]);

  const { data: grupos = [] } = useQuery<GrupoPermissao[]>({
    queryKey: ["grupos_permissao"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("grupos_permissao" as any) as any)
        .select("*")
        .order("nome");
      if (error) throw error;
      return ((data ?? []) as any[]).map((row) => ({
        id: row.id,
        nome: row.nome,
        permissoes: (row.permissoes ?? {}) as GrupoPermissoes,
      }));
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["grupos_permissao"] });

  const createMutation = useMutation({
    mutationFn: async (item: { nome: string; permissoes: GrupoPermissoes }) => {
      const { data, error } = await (supabase.from("grupos_permissao" as any) as any)
        .insert({ nome: item.nome, permissoes: item.permissoes as any })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, nome, permissoes }: { id: string; nome: string; permissoes: GrupoPermissoes }) => {
      const { error } = await (supabase.from("grupos_permissao" as any) as any)
        .update({ nome, permissoes: permissoes as any })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("grupos_permissao" as any) as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const [nome, setNome] = useState("");
  const [permissoes, setPermissoes] = useState<GrupoPermissoes>(criarPermissoesVazias);
  const [editId, setEditId] = useState<string | null>(null);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MODULOS_PAGINAS.forEach((m) => { initial[m.modulo] = true; });
    return initial;
  });

  const togglePermissao = (key: string, perm: string) => {
    setPermissoes((prev) => {
      const current = { ...prev[key] };
      const permIndex = PERMISSOES.indexOf(perm as typeof PERMISSOES[number]);
      if (current[perm]) {
        for (let i = 0; i < PERMISSOES.length; i++) current[PERMISSOES[i]] = false;
      } else {
        for (let i = 0; i <= permIndex; i++) current[PERMISSOES[i]] = true;
      }
      return { ...prev, [key]: current };
    });
  };

  const isDisabledByHierarchy = (key: string, perm: string): boolean => {
    const modPerms = permissoes[key];
    if (!modPerms) return false;
    const permIndex = PERMISSOES.indexOf(perm as typeof PERMISSOES[number]);
    const highestIndex = getHighestPermIndex(modPerms);
    return permIndex < highestIndex && modPerms[perm];
  };

  const resetForm = () => {
    setNome("");
    setPermissoes(criarPermissoesVazias());
    setEditId(null);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      toast.error("Nome do grupo é obrigatório.");
      return;
    }
    try {
      if (editId) {
        await updateMutation.mutateAsync({ id: editId, nome: nome.trim(), permissoes });
        logAction({ modulo: "Admin", pagina: "Grupos de Permissão", acao: "edicao", descricao: `Editou grupo de permissão: ${nome.trim()}`, registro_id: editId, registro_ref: nome.trim() });
        toast.success("Grupo atualizado.");
      } else {
        const created: any = await createMutation.mutateAsync({ nome: nome.trim(), permissoes });
        logAction({ modulo: "Admin", pagina: "Grupos de Permissão", acao: "criacao", descricao: `Criou grupo de permissão: ${nome.trim()}`, registro_id: created?.id, registro_ref: nome.trim() });
        toast.success("Grupo de permissão criado.");
      }
      resetForm();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar grupo.");
    }
  };

  const handleEdit = (g: GrupoPermissao) => {
    setEditId(g.id);
    setNome(g.nome);
    const base = criarPermissoesVazias();
    Object.keys(g.permissoes).forEach((key) => {
      if (base[key]) base[key] = { ...base[key], ...g.permissoes[key] };
    });
    setPermissoes(base);
  };

  const handleDelete = async (id: string) => {
    const g = grupos.find((g) => g.id === id);
    try {
      await deleteMutation.mutateAsync(id);
      logAction({ modulo: "Admin", pagina: "Grupos de Permissão", acao: "exclusao", descricao: `Excluiu grupo de permissão: ${g?.nome || "—"}`, registro_id: id, registro_ref: g?.nome });
      toast.success("Grupo excluído.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir grupo.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Grupos de Permissão
      </h2>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="section-title">{editId ? "Editar Grupo" : "Novo Grupo"}</h3>
          <div className="mb-4">
            <Label>Nome do Grupo *</Label>
            <Input
              placeholder="Ex: Administrador, Operador..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="mb-4">
            <Label className="mb-2 block">Permissões por Módulo e Página</Label>
            <div className="space-y-2">
              {MODULOS_PAGINAS.map((mod) => (
                <Collapsible
                  key={mod.modulo}
                  open={openModules[mod.modulo] ?? true}
                  onOpenChange={() => setOpenModules((prev) => ({ ...prev, [mod.modulo]: !prev[mod.modulo] }))}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2.5 rounded-md bg-muted/50 hover:bg-muted text-foreground transition-colors border border-border">
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                        openModules[mod.modulo] ? "rotate-180" : ""
                      }`}
                    />
                    <span className="text-sm font-semibold uppercase tracking-wider">
                      {mod.modulo}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto mr-2">
                      {mod.paginas.length} página(s)
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border border-border border-t-0 rounded-b-lg overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Página</TableHead>
                            {PERMISSOES.map((p) => (
                              <TableHead key={p} className="text-center">{PERMISSAO_LABELS[p]}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mod.paginas.map((pag) => {
                            const key = makeKey(mod.modulo, pag);
                            return (
                              <TableRow key={key}>
                                <TableCell className="font-medium pl-6">{pag}</TableCell>
                                {PERMISSOES.map((p) => {
                                  const disabled = isDisabledByHierarchy(key, p);
                                  return (
                                    <TableCell key={p} className="text-center">
                                      <Checkbox
                                        checked={permissoes[key]?.[p] ?? false}
                                        onCheckedChange={() => togglePermissao(key, p)}
                                        disabled={disabled}
                                        className={disabled ? "opacity-60" : ""}
                                      />
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>

          {/* Legenda */}
          <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Legenda de Permissões</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Acesso</strong> — Define se o usuário pode acessar/entrar na página. Sem esta permissão, a página nem aparece no menu.</li>
              <li><strong className="text-foreground">Visualização</strong> — Permite ver os dados/registros existentes na página, mas sem poder alterar nada.</li>
              <li><strong className="text-foreground">Criação</strong> — Permite criar novos registros.</li>
              <li><strong className="text-foreground">Edição</strong> — Permite modificar registros já existentes.</li>
              <li><strong className="text-foreground">Exclusão</strong> — Permite remover/excluir registros.</li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground italic">
              ⚡ Hierarquia automática: ao marcar uma permissão superior, todas as inferiores são habilitadas automaticamente.
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={createMutation.isPending || updateMutation.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              {editId ? "Atualizar" : "Criar Grupo"}
            </Button>
            {editId && (
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {grupos.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="section-title">Grupos Cadastrados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grupos.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell>{g.nome}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(g.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminPermissoes;
