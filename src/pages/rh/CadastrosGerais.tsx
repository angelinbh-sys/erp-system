import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCentrosCusto,
  useTiposContrato,
  useCargos,
  type CentroCusto,
  type TipoContrato,
  type Cargo,
} from "@/hooks/useCadastros";

// ─── Centro de Custo Section ────────────────────────────────────────
function CentroCustoSection() {
  const { items, add, update, remove } = useCentrosCusto();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do Centro de Custo é obrigatório.");
      return;
    }
    if (editId) {
      update(editId, { nome: nome.trim(), codigo: codigo.trim(), descricao: descricao.trim() });
      toast.success("Centro de Custo atualizado.");
    } else {
      add({ nome: nome.trim(), codigo: codigo.trim(), descricao: descricao.trim() });
      toast.success("Centro de Custo cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (item: CentroCusto) => {
    setEditId(item.id);
    setNome(item.nome);
    setCodigo(item.codigo);
    setDescricao(item.descricao);
  };

  const handleDelete = (id: string) => {
    remove(id);
    toast.success("Centro de Custo excluído.");
  };

  const resetForm = () => {
    setEditId(null);
    setNome("");
    setCodigo("");
    setDescricao("");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="section-title">Cadastro de Centro de Custo</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input placeholder="Nome do Centro de Custo *" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Código (opcional)" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="flex gap-2 mb-4">
          <Button onClick={handleSave} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {editId ? "Atualizar" : "Adicionar"}
          </Button>
          {editId && (
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </div>
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.codigo || "—"}</TableCell>
                  <TableCell>{item.descricao || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Tipo de Contrato Section ───────────────────────────────────────
function TipoContratoSection() {
  const { items, add, update, remove } = useTiposContrato();
  const [nome, setNome] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do contrato é obrigatório.");
      return;
    }
    if (editId) {
      update(editId, { nome: nome.trim() });
      toast.success("Tipo de Contrato atualizado.");
    } else {
      add({ nome: nome.trim() });
      toast.success("Tipo de Contrato cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (item: TipoContrato) => {
    setEditId(item.id);
    setNome(item.nome);
  };

  const handleDelete = (id: string) => {
    remove(id);
    toast.success("Tipo de Contrato excluído.");
  };

  const resetForm = () => {
    setEditId(null);
    setNome("");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="section-title">Cadastro de Tipo de Contrato</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input placeholder="Nome do contrato *" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <div className="flex gap-2 mb-4">
          <Button onClick={handleSave} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {editId ? "Atualizar" : "Adicionar"}
          </Button>
          {editId && (
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </div>
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Cargos / Funções Section ───────────────────────────────────────
function CargosSection() {
  const { items, add, update, remove } = useCargos();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do cargo é obrigatório.");
      return;
    }
    if (editId) {
      update(editId, { nome: nome.trim(), descricao: descricao.trim() });
      toast.success("Cargo atualizado.");
    } else {
      add({ nome: nome.trim(), descricao: descricao.trim() });
      toast.success("Cargo cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (item: Cargo) => {
    setEditId(item.id);
    setNome(item.nome);
    setDescricao(item.descricao);
  };

  const handleDelete = (id: string) => {
    remove(id);
    toast.success("Cargo excluído.");
  };

  const resetForm = () => {
    setEditId(null);
    setNome("");
    setDescricao("");
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="section-title">Cadastro de Cargos / Funções</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input placeholder="Nome do cargo *" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="flex gap-2 mb-4">
          <Button onClick={handleSave} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {editId ? "Atualizar" : "Adicionar"}
          </Button>
          {editId && (
            <Button variant="outline" size="sm" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </div>
        {items.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.nome}</TableCell>
                  <TableCell>{item.descricao || "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────
const CadastrosGerais = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Cadastros Gerais
      </h2>
      <div className="space-y-8">
        <CentroCustoSection />
        <TipoContratoSection />
        <CargosSection />
      </div>
    </div>
  );
};

export default CadastrosGerais;
