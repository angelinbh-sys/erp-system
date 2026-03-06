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
  useCargos,
  type CentroCusto,
  type SiteContrato,
  type Cargo,
} from "@/hooks/useCadastros";

// ─── Centro de Custo Section ────────────────────────────────────────
function CentroCustoSection() {
  const { items, add, update, remove, setItems } = useCentrosCusto();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Site management per centro de custo
  const [siteNome, setSiteNome] = useState("");
  const [editSiteId, setEditSiteId] = useState<string | null>(null);
  const [expandedCC, setExpandedCC] = useState<string | null>(null);

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Nome do Centro de Custo é obrigatório.");
      return;
    }
    if (!codigo.trim()) {
      toast.error("Código do Centro de Custo é obrigatório.");
      return;
    }
    if (editId) {
      const existing = items.find((i) => i.id === editId);
      update(editId, { nome: nome.trim(), codigo: codigo.trim(), sites: existing?.sites ?? [] });
      toast.success("Centro de Custo atualizado.");
    } else {
      add({ nome: nome.trim(), codigo: codigo.trim(), sites: [] });
      toast.success("Centro de Custo cadastrado.");
    }
    resetForm();
  };

  const handleEdit = (item: CentroCusto) => {
    setEditId(item.id);
    setNome(item.nome);
    setCodigo(item.codigo);
  };

  const handleDelete = (id: string) => {
    remove(id);
    toast.success("Centro de Custo excluído.");
  };

  const resetForm = () => {
    setEditId(null);
    setNome("");
    setCodigo("");
  };

  // Site CRUD
  const addSite = (ccId: string) => {
    if (!siteNome.trim()) {
      toast.error("Nome do Site / Contrato é obrigatório.");
      return;
    }
    if (editSiteId) {
      setItems((prev) =>
        prev.map((cc) =>
          cc.id === ccId
            ? { ...cc, sites: cc.sites.map((s) => (s.id === editSiteId ? { ...s, nome: siteNome.trim() } : s)) }
            : cc
        )
      );
      toast.success("Site / Contrato atualizado.");
      setEditSiteId(null);
    } else {
      setItems((prev) =>
        prev.map((cc) =>
          cc.id === ccId
            ? { ...cc, sites: [...(cc.sites || []), { id: crypto.randomUUID(), nome: siteNome.trim() }] }
            : cc
        )
      );
      toast.success("Site / Contrato adicionado.");
    }
    setSiteNome("");
  };

  const removeSite = (ccId: string, siteId: string) => {
    setItems((prev) =>
      prev.map((cc) =>
        cc.id === ccId ? { ...cc, sites: cc.sites.filter((s) => s.id !== siteId) } : cc
      )
    );
    toast.success("Site / Contrato removido.");
  };

  const editSite = (site: SiteContrato) => {
    setEditSiteId(site.id);
    setSiteNome(site.nome);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="section-title">Cadastro de Centro de Custo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input placeholder="Nome do Centro de Custo *" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input placeholder="Código *" value={codigo} onChange={(e) => setCodigo(e.target.value)} />
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
                <TableHead>Sites</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <>
                  <TableRow key={item.id}>
                    <TableCell>{item.nome}</TableCell>
                    <TableCell>{item.codigo}</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto text-xs"
                        onClick={() => {
                          setExpandedCC(expandedCC === item.id ? null : item.id);
                          setSiteNome("");
                          setEditSiteId(null);
                        }}
                      >
                        {(item.sites?.length || 0)} site(s) — {expandedCC === item.id ? "Fechar" : "Gerenciar"}
                      </Button>
                    </TableCell>
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
                  {expandedCC === item.id && (
                    <TableRow key={`${item.id}-sites`}>
                      <TableCell colSpan={4} className="bg-muted/30">
                        <div className="p-3 space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            Sites / Contratos de "{item.nome}"
                          </p>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Nome do Site / Contrato *"
                              value={siteNome}
                              onChange={(e) => setSiteNome(e.target.value)}
                              className="max-w-xs"
                            />
                            <Button size="sm" onClick={() => addSite(item.id)}>
                              <Plus className="h-4 w-4 mr-1" />
                              {editSiteId ? "Atualizar" : "Adicionar"}
                            </Button>
                            {editSiteId && (
                              <Button variant="outline" size="sm" onClick={() => { setEditSiteId(null); setSiteNome(""); }}>
                                Cancelar
                              </Button>
                            )}
                          </div>
                          {(item.sites?.length || 0) > 0 && (
                            <div className="space-y-1">
                              {item.sites.map((site) => (
                                <div key={site.id} className="flex items-center gap-2 text-sm pl-2">
                                  <span className="flex-1">{site.nome}</span>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => editSite(site)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeSite(item.id, site.id)}>
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
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
const GestaoRH = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="font-heading text-2xl font-bold text-foreground mb-6">
        Gestão RH
      </h2>
      <div className="space-y-8">
        <CentroCustoSection />
        <CargosSection />
      </div>
    </div>
  );
};

export default GestaoRH;
