import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, UserX, UserCheck } from "lucide-react";

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

interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  senha: string;
  grupoPermissao: string;
  ativo: boolean;
}

const AdminUsuarios = () => {
  const [grupos] = useState<GrupoPermissao[]>(() => {
    try {
      const stored = localStorage.getItem("erp_grupos_permissao");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const stored = localStorage.getItem("erp_usuarios");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  const save = (items: Usuario[]) => {
    setUsuarios(items);
    localStorage.setItem("erp_usuarios", JSON.stringify(items));
  };

  const [form, setForm] = useState({ nome: "", email: "", cpf: "", senha: "", grupoPermissao: "" });
  const [cpfError, setCpfError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const resetForm = () => {
    setForm({ nome: "", email: "", cpf: "", senha: "", grupoPermissao: "" });
    setCpfError("");
    setEditId(null);
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
    const pasted = e.clipboardData.getData("text");
    handleCPFChange(pasted);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.email.trim() || (!editId && !form.senha.trim()) || !form.grupoPermissao || !form.cpf.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    if (!isValidCPF(form.cpf)) {
      setCpfError("CPF inválido.");
      return;
    }
    if (editId) {
      save(usuarios.map((u) => u.id === editId ? { ...u, nome: form.nome.trim(), email: form.email.trim(), cpf: form.cpf, grupoPermissao: form.grupoPermissao, ...(form.senha ? { senha: form.senha } : {}) } : u));
      toast.success("Usuário atualizado.");
    } else {
      save([...usuarios, { id: crypto.randomUUID(), nome: form.nome.trim(), email: form.email.trim(), cpf: form.cpf, senha: form.senha, grupoPermissao: form.grupoPermissao, ativo: true }]);
      toast.success("Usuário criado.");
    }
    resetForm();
  };

  const handleEdit = (u: Usuario) => {
    setEditId(u.id);
    setForm({ nome: u.nome, email: u.email, cpf: u.cpf || "", senha: "", grupoPermissao: u.grupoPermissao });
    setCpfError("");
  };

  const toggleAtivo = (id: string) => {
    save(usuarios.map((u) => u.id === id ? { ...u, ativo: !u.ativo } : u));
    toast.success("Status atualizado.");
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Gestão de Usuários
      </h2>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <h3 className="section-title">{editId ? "Editar Usuário" : "Novo Usuário"}</h3>
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
              <Label>CPF *</Label>
              <Input
                placeholder="000.000.000-00"
                value={form.cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                onPaste={handleCPFPaste}
              />
              {cpfError && <p className="text-sm text-destructive mt-1">{cpfError}</p>}
            </div>
            <div>
              <Label>{editId ? "Nova Senha (deixe vazio para manter)" : "Senha *"}</Label>
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
            <Button onClick={handleSave} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {editId ? "Atualizar" : "Criar Usuário"}
            </Button>
            {editId && (
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {usuarios.length > 0 && (
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
                    <TableCell>{u.grupoPermissao}</TableCell>
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
                        <Button variant="ghost" size="icon" onClick={() => toggleAtivo(u.id)}>
                          {u.ativo ? <UserX className="h-4 w-4 text-destructive" /> : <UserCheck className="h-4 w-4 text-success" />}
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
