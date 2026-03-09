import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MODULOS = [
  "Início",
  "Recursos Humanos",
  "Dep. Pessoal",
  "SESMT",
  "Financeiro",
  "Logística",
  "Qualidade",
  "Admin",
] as const;

// Ordered from lowest to highest
const PERMISSOES = ["acesso", "visualizacao", "criacao", "edicao", "exclusao"] as const;
const PERMISSAO_LABELS: Record<string, string> = {
  acesso: "Acesso",
  visualizacao: "Visualização",
  criacao: "Criação",
  edicao: "Edição",
  exclusao: "Exclusão",
};

type ModuloPermissoes = Record<string, boolean>;
type GrupoPermissoes = Record<string, ModuloPermissoes>;

export interface GrupoPermissao {
  id: string;
  nome: string;
  permissoes: GrupoPermissoes;
}

function criarPermissoesVazias(): GrupoPermissoes {
  const result: GrupoPermissoes = {};
  MODULOS.forEach((mod) => {
    result[mod] = {};
    PERMISSOES.forEach((p) => {
      result[mod][p] = false;
    });
  });
  return result;
}

/**
 * Apply hierarchy: when a higher permission is set, all lower ones are auto-set.
 * Hierarchy order (index): acesso(0) < visualizacao(1) < criacao(2) < edicao(3) < exclusao(4)
 */
function applyHierarchy(modPerms: ModuloPermissoes): ModuloPermissoes {
  const result = { ...modPerms };
  // Find the highest enabled permission
  let highestIndex = -1;
  for (let i = PERMISSOES.length - 1; i >= 0; i--) {
    if (result[PERMISSOES[i]]) {
      highestIndex = i;
      break;
    }
  }
  // Enable all below the highest
  for (let i = 0; i < PERMISSOES.length; i++) {
    if (i <= highestIndex) {
      result[PERMISSOES[i]] = true;
    }
  }
  return result;
}

function getHighestPermIndex(modPerms: ModuloPermissoes): number {
  for (let i = PERMISSOES.length - 1; i >= 0; i--) {
    if (modPerms[PERMISSOES[i]]) return i;
  }
  return -1;
}

const AdminPermissoes = () => {
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

  const togglePermissao = (modulo: string, perm: string) => {
    setPermissoes((prev) => {
      const current = { ...prev[modulo] };
      const permIndex = PERMISSOES.indexOf(perm as typeof PERMISSOES[number]);

      if (current[perm]) {
        // Unchecking: uncheck this and all above
        for (let i = permIndex; i < PERMISSOES.length; i++) {
          current[PERMISSOES[i]] = false;
        }
      } else {
        // Checking: check this and all below
        for (let i = 0; i <= permIndex; i++) {
          current[PERMISSOES[i]] = true;
        }
      }

      return { ...prev, [modulo]: current };
    });
  };

  const isDisabledByHierarchy = (modulo: string, perm: string): boolean => {
    const modPerms = permissoes[modulo];
    if (!modPerms) return false;
    const permIndex = PERMISSOES.indexOf(perm as typeof PERMISSOES[number]);
    const highestIndex = getHighestPermIndex(modPerms);
    // Disabled if it's below the highest and checked (auto-inherited)
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
    // Re-apply hierarchy to stored permissions
    const fixed: GrupoPermissoes = {};
    MODULOS.forEach((mod) => {
      fixed[mod] = applyHierarchy(g.permissoes[mod] || {});
    });
    setPermissoes(fixed);
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
            <Label className="mb-2 block">Permissões por Módulo</Label>
            <div className="border rounded-lg overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    {PERMISSOES.map((p) => (
                      <TableHead key={p} className="text-center">{PERMISSAO_LABELS[p]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MODULOS.map((mod) => (
                    <TableRow key={mod}>
                      <TableCell className="font-medium">{mod}</TableCell>
                      {PERMISSOES.map((p) => {
                        const disabled = isDisabledByHierarchy(mod, p);
                        return (
                          <TableCell key={p} className="text-center">
                            <Checkbox
                              checked={permissoes[mod]?.[p] ?? false}
                              onCheckedChange={() => togglePermissao(mod, p)}
                              disabled={disabled}
                              className={disabled ? "opacity-60" : ""}
                            />
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Legenda de Permissões */}
          <div className="mb-4 p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Legenda de Permissões</span>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Acesso</strong> — Define se o usuário pode acessar/entrar no módulo. Sem esta permissão, o módulo nem aparece no menu.</li>
              <li><strong className="text-foreground">Visualização</strong> — Permite ver os dados/registros existentes no módulo, mas sem poder alterar nada.</li>
              <li><strong className="text-foreground">Criação</strong> — Permite criar novos registros (ex: abrir uma vaga, cadastrar uma carga).</li>
              <li><strong className="text-foreground">Edição</strong> — Permite modificar registros já existentes.</li>
              <li><strong className="text-foreground">Exclusão</strong> — Permite remover/excluir registros. É uma permissão mais sensível.</li>
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
