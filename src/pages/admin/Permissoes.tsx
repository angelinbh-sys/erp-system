import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Info, ChevronDown } from "lucide-react";
import { useAuditLog } from "@/hooks/useAuditLog";

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
    modulo: "Início",
    paginas: ["Página Início"],
  },
  {
    modulo: "Recursos Humanos",
    paginas: ["Gestão RH", "Abertura de Vaga", "Aprovação de Vagas"],
  },
  {
    modulo: "Dep. Pessoal",
    paginas: ["Alteração de Função / Cargo", "Solicitação de Férias", "Admissão", "Efetivo"],
  },
  {
    modulo: "SESMT",
    paginas: ["Agendamento de ASO"],
  },
  {
    modulo: "Financeiro",
    paginas: ["Financeiro"],
  },
  {
    modulo: "Logística",
    paginas: ["Logística"],
  },
  {
    modulo: "Qualidade",
    paginas: ["Qualidade"],
  },
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

// Key = "Modulo::Pagina", value = { acesso: bool, ... }
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

const AdminPermissoes = () => {
  const { logAction } = useAuditLog();
  const [grupos, setGrupos] = useState<GrupoPermissao[]>(() => {
    try {
      const stored = localStorage.getItem("erp_grupos_permissao");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const save = (items: GrupoPermissao[]) => {
    setGrupos(items);
    localStorage.setItem("erp_grupos_permissao", JSON.stringify(items));
  };

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
        for (let i = permIndex; i < PERMISSOES.length; i++) {
          current[PERMISSOES[i]] = false;
        }
      } else {
        for (let i = 0; i <= permIndex; i++) {
          current[PERMISSOES[i]] = true;
        }
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

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do grupo é obrigatório.");
      return;
    }
    if (editId) {
      save(grupos.map((g) => (g.id === editId ? { ...g, nome: nome.trim(), permissoes } : g)));
      toast.success("Grupo atualizado.");
    } else {
      save([...grupos, { id: crypto.randomUUID(), nome: nome.trim(), permissoes }]);
      toast.success("Grupo de permissão criado.");
    }
    resetForm();
  };

  const handleEdit = (g: GrupoPermissao) => {
    setEditId(g.id);
    setNome(g.nome);
    // Merge stored permissions with current structure (handles new pages)
    const base = criarPermissoesVazias();
    Object.keys(g.permissoes).forEach((key) => {
      if (base[key]) {
        base[key] = { ...base[key], ...g.permissoes[key] };
      }
    });
    setPermissoes(base);
  };

  const handleDelete = (id: string) => {
    save(grupos.filter((g) => g.id !== id));
    toast.success("Grupo excluído.");
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
            <Button onClick={handleSave} size="sm">
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
