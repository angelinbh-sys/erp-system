import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { GrupoPermissao } from "@/pages/admin/Permissoes";
import { formatCPF, isValidCPF } from "@/utils/cpf";

interface Profile {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  cpf: string | null;
  grupo_permissao: string;
  ativo: boolean;
}

const AdminUsuarios = () => {
  const [grupos] = useState<GrupoPermissao[]>(() => {
    try {
      const stored = localStorage.getItem("erp_grupos_permissao");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsuarios = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) setUsuarios(data as Profile[]);
    setLoading(false);
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const [form, setForm] = useState({ nome: "", email: "", cpf: "", senha: "", grupoPermissao: "" });
  const [cpfError, setCpfError] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setForm({ nome: "", email: "", cpf: "", senha: "", grupoPermissao: "" });
    setCpfError("");
    setEditUserId(null);
  };

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value);
    setForm((p) => ({ ...p, cpf: formatted }));
    const digits = formatted.replace(/\D/g, "");
    if (digits.length === 11) {
      setCpfError(isValidCPF(formatted) ? "" : "CPF inválido.");
    } else {
      setCpfError("");
    }
  };

  const handleCPFPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    handleCPFChange(e.clipboardData.getData("text"));
  };

  const handleSave = async () => {
    if (!form.nome.trim() || !form.email.trim() || !form.senha.trim() || !form.grupoPermissao) {
      toast.error("Preencha todos os campos obrigatórios para criar o usuário.");
      return;
    }
    if (form.cpf.trim() && !isValidCPF(form.cpf)) {
      setCpfError("CPF inválido.");
      return;
    }

    setSaving(true);
    try {
      if (editUserId) {
        const { data, error } = await supabase.functions.invoke("admin-update-user", {
          body: {
            user_id: editUserId,
            nome: form.nome.trim(),
            email: form.email.trim(),
            cpf: form.cpf || null,
            grupo_permissao: form.grupoPermissao,
            ...(form.senha ? { senha: form.senha } : {}),
          },
        });
        if (error || data?.error) throw new Error(data?.error || "Erro ao atualizar");
        toast.success("Usuário atualizado.");
      } else {
        const { data, error } = await supabase.functions.invoke("admin-create-user", {
          body: {
            nome: form.nome.trim(),
            email: form.email.trim(),
            cpf: form.cpf || null,
            senha: form.senha,
            grupo_permissao: form.grupoPermissao,
          },
        });
        if (error || data?.error) throw new Error(data?.error || "Erro ao criar usuário");
        toast.success("Usuário criado.");
      }
      resetForm();
      fetchUsuarios();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao salvar usuário.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (u: Profile) => {
    setEditUserId(u.user_id);
    setForm({ nome: u.nome, email: u.email, cpf: u.cpf || "", senha: "", grupoPermissao: u.grupo_permissao });
    setCpfError("");
  };

  const toggleAtivo = async (u: Profile) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-user", {
        body: { user_id: u.user_id, ativo: !u.ativo },
      });
      if (error || data?.error) throw new Error(data?.error || "Erro");
      toast.success("Status atualizado.");
      fetchUsuarios();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Gestão de Usuários
      </h2>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="section-title">{editUserId ? "Editar Usuário" : "Novo Usuário"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Nome *</Label>
              <Input placeholder="Nome completo" value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" placeholder="email@empresa.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                onPaste={handleCPFPaste}
              />
              {cpfError && <p className="text-sm text-destructive mt-1">{cpfError}</p>}
            </div>
            <div>
              <Label>{editUserId ? "Nova Senha (deixe vazio para manter)" : "Senha *"}</Label>
              <Input type="password" placeholder="••••••••" value={form.senha} onChange={(e) => setForm((p) => ({ ...p, senha: e.target.value }))} />
            </div>
            <div>
              <Label>Grupo de Permissão *</Label>
              <Select value={form.grupoPermissao} onValueChange={(v) => setForm((p) => ({ ...p, grupoPermissao: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {grupos.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">Cadastre primeiro um grupo em Grupos de Permissão.</div>
                  ) : grupos.map((g) => (
                    <SelectItem key={g.id} value={g.nome}>{g.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} size="sm" disabled={saving}>
              <Plus className="h-4 w-4 mr-1" />
              {saving ? "Salvando..." : editUserId ? "Atualizar" : "Criar Usuário"}
            </Button>
            {editUserId && (
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : usuarios.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="section-title">Usuários Cadastrados</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.nome}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.cpf || "—"}</TableCell>
                    <TableCell>{u.grupo_permissao}</TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? "default" : "secondary"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleAtivo(u)}>
                          {u.ativo ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-green-600" />}
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

export default AdminUsuarios;
