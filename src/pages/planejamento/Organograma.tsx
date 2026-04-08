import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, FileDown } from "lucide-react";
import { useContratos } from "@/hooks/useContratos";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useCargos } from "@/hooks/useCadastros";
import { useOrganograma, type OrganogramaNode } from "@/hooks/useOrganograma";
import { OrgTree } from "@/components/organograma/OrgTree";
import { OrgTable } from "@/components/organograma/OrgTable";
import { NodeFormDialog } from "@/components/organograma/NodeFormDialog";
import { NodeDetailDialog } from "@/components/organograma/NodeDetailDialog";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Organograma() {
  const { contratosQuery } = useContratos();
  const contratos = contratosQuery.data ?? [];
  const { items: cargos } = useCargos();

  const [contratoId, setContratoId] = useState<string>("");
  const { nodesQuery, createNode, updateNode, deleteNode } = useOrganograma(contratoId || undefined);
  const nodes = nodesQuery.data ?? [];

  const contratoSelecionado = contratos.find((c) => c.id === contratoId);
  const projetoNome = contratoSelecionado?.projeto_obra ?? "";
  const siteContrato = contratoSelecionado?.cliente ?? "";

  const colaboradoresData = useColaboradores();
  const colaboradores = (colaboradoresData.data ?? [])
    .filter((c) => c.status === "Ativo")
    .map((c) => ({ id: c.id, nome: c.nome, cargo: c.cargo }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const [formOpen, setFormOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrganogramaNode | null>(null);
  const [detailNode, setDetailNode] = useState<OrganogramaNode | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [presetSuperiorId, setPresetSuperiorId] = useState<string | null>(null);
  const [addAboveNode, setAddAboveNode] = useState<OrganogramaNode | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  /* ── PDF Export (A3 landscape, visual + table) ── */
  const handleExportPDF = useCallback(async () => {
    if (!treeRef.current) return;
    setExporting(true);
    try {
      // A3 dimensions in mm
      const A3_W = 420;
      const A3_H = 297;
      const margin = 15;
      const usableW = A3_W - margin * 2;

      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a3" });

      // Title
      pdf.setFontSize(16);
      pdf.text(`Organograma — ${projetoNome}`, margin, margin + 6);
      let cursorY = margin + 14;

      // 1) Capture visual tree
      const treeCanvas = await html2canvas(treeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const treeImgData = treeCanvas.toDataURL("image/png");
      const treeRatio = Math.min(usableW / treeCanvas.width, (A3_H - cursorY - margin - 10) / treeCanvas.height);
      const treeDrawW = treeCanvas.width * treeRatio;
      const treeDrawH = treeCanvas.height * treeRatio;
      const treeOffsetX = margin + (usableW - treeDrawW) / 2;

      pdf.addImage(treeImgData, "PNG", treeOffsetX, cursorY, treeDrawW, treeDrawH);
      cursorY += treeDrawH + 10;

      // 2) Capture table
      if (tableRef.current) {
        const tableCanvas = await html2canvas(tableRef.current, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        });
        const tableImgData = tableCanvas.toDataURL("image/png");
        const tableRatio = Math.min(usableW / tableCanvas.width, 1);
        const tableDrawW = tableCanvas.width * tableRatio;
        const tableDrawH = tableCanvas.height * tableRatio;

        // Check if table fits on current page
        if (cursorY + tableDrawH > A3_H - margin) {
          pdf.addPage("a3", "landscape");
          cursorY = margin;
          pdf.setFontSize(12);
          pdf.text(`Organograma — ${projetoNome} (Tabela)`, margin, cursorY + 4);
          cursorY += 10;
        }

        const tableOffsetX = margin + (usableW - tableDrawW) / 2;
        pdf.addImage(tableImgData, "PNG", tableOffsetX, cursorY, tableDrawW, tableDrawH);
      }

      const safeName = projetoNome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");
      pdf.save(`organograma_${safeName || "projeto"}.pdf`);
      toast.success("PDF exportado com sucesso.");
    } catch {
      toast.error("Erro ao exportar PDF.");
    } finally {
      setExporting(false);
    }
  }, [projetoNome]);

  const handleNodeClick = (node: OrganogramaNode) => {
    setDetailNode(node);
    setDetailOpen(true);
  };

  const handleEdit = (node: OrganogramaNode) => {
    setEditingNode(node);
    setFormOpen(true);
  };

  const handleAddBelow = (parentNode: OrganogramaNode) => {
    setEditingNode(null);
    setAddAboveNode(null);
    setPresetSuperiorId(parentNode.id);
    setFormOpen(true);
  };

  const handleAddAbove = (childNode: OrganogramaNode) => {
    setEditingNode(null);
    setPresetSuperiorId(childNode.superior_id ?? null);
    setAddAboveNode(childNode);
    setFormOpen(true);
  };

  const handleSave = async (data: {
    cargo: string;
    nome_colaborador: string;
    superior_id: string | null;
    colaborador_id: string | null;
    quantidade: number;
    observacao: string | null;
  }) => {
    try {
      if (editingNode) {
        await updateNode.mutateAsync({ id: editingNode.id, ...data, quantidade: 1 });
        toast.success("Posição atualizada com sucesso.");
      } else if (addAboveNode) {
        const qty = Math.max(1, data.quantidade);
        const created = await createNode.mutateAsync({
          cargo: data.cargo,
          nome_colaborador: data.nome_colaborador,
          superior_id: data.superior_id,
          colaborador_id: data.colaborador_id,
          quantidade: 1,
          observacao: data.observacao,
          contrato_id: contratoId,
        });
        await updateNode.mutateAsync({ id: addAboveNode.id, superior_id: created.id });
        if (qty > 1) {
          const extra = Array.from({ length: qty - 1 }, () =>
            createNode.mutateAsync({
              cargo: data.cargo,
              nome_colaborador: data.nome_colaborador,
              superior_id: data.superior_id,
              colaborador_id: data.colaborador_id,
              quantidade: 1,
              observacao: data.observacao,
              contrato_id: contratoId,
            })
          );
          await Promise.all(extra);
        }
        toast.success("Posição adicionada acima com sucesso.");
      } else {
        const qty = Math.max(1, data.quantidade);
        const promises = Array.from({ length: qty }, () =>
          createNode.mutateAsync({
            cargo: data.cargo,
            nome_colaborador: data.nome_colaborador,
            superior_id: data.superior_id,
            colaborador_id: data.colaborador_id,
            quantidade: 1,
            observacao: data.observacao,
            contrato_id: contratoId,
          })
        );
        await Promise.all(promises);
        toast.success(`${qty} posição(ões) adicionada(s) com sucesso.`);
      }
      setEditingNode(null);
      setAddAboveNode(null);
      setPresetSuperiorId(null);
    } catch {
      toast.error("Erro ao salvar posição.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const hasChildren = nodes.some((n) => n.superior_id === id);
      if (hasChildren) {
        toast.error("Remova os subordinados antes de excluir esta posição.");
        return;
      }
      await deleteNode.mutateAsync(id);
      toast.success("Posição excluída.");
    } catch {
      toast.error("Erro ao excluir posição.");
    }
  };

  const handleLinkColaborador = async (nodeId: string, colaboradorId: string, nomeColaborador: string) => {
    try {
      await updateNode.mutateAsync({ id: nodeId, colaborador_id: colaboradorId, nome_colaborador: nomeColaborador });
      setDetailNode((prev) => prev ? { ...prev, colaborador_id: colaboradorId, nome_colaborador: nomeColaborador } : prev);
      toast.success("Colaborador vinculado com sucesso.");
    } catch {
      toast.error("Erro ao vincular colaborador.");
    }
  };

  const handleUnlinkColaborador = async (nodeId: string) => {
    try {
      await updateNode.mutateAsync({ id: nodeId, colaborador_id: null, nome_colaborador: "" });
      setDetailNode((prev) => prev ? { ...prev, colaborador_id: null, nome_colaborador: "" } : prev);
      toast.success("Colaborador desvinculado.");
    } catch {
      toast.error("Erro ao desvincular colaborador.");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Organograma de Projetos</h1>

      <Card className="shadow-md border-border/40">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Projeto / Contrato</Label>
              <Select value={contratoId} onValueChange={setContratoId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent className="max-h-60 z-[9999]">
                  {contratos.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.projeto_obra} — {c.cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {contratoId && (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => { setEditingNode(null); setAddAboveNode(null); setPresetSuperiorId(null); setFormOpen(true); }}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" /> Adicionar Posição
                </Button>
                {nodes.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="gap-1"
                  >
                    <FileDown className="h-4 w-4" />
                    {exporting ? "Exportando..." : "Exportar em PDF"}
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {contratoId ? (
        <>
          {/* Visual organograma */}
          <Card className="shadow-md border-border/40 min-h-[400px]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-heading font-bold text-foreground">
                {projetoNome}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrgTree ref={treeRef} nodes={nodes} onNodeClick={handleNodeClick} />
            </CardContent>
          </Card>

          {/* Hierarchy table */}
          {nodes.length > 0 && (
            <Card className="shadow-md border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-heading font-bold text-foreground">
                  Tabela Hierárquica
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0" ref={tableRef}>
                <OrgTable nodes={nodes} projetoNome={projetoNome} siteContrato={siteContrato} />
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card className="shadow-md border-border/40">
          <CardContent className="py-16 text-center text-muted-foreground text-sm">
            Selecione um projeto para visualizar ou criar o organograma.
          </CardContent>
        </Card>
      )}

      <NodeFormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) { setPresetSuperiorId(null); setAddAboveNode(null); } }}
        onSave={handleSave}
        editingNode={editingNode}
        existingNodes={nodes}
        cargos={cargos}
        presetSuperiorId={presetSuperiorId}
      />

      <NodeDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        node={detailNode}
        allNodes={nodes}
        projetoNome={projetoNome}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onLinkColaborador={handleLinkColaborador}
        onUnlinkColaborador={handleUnlinkColaborador}
        colaboradores={colaboradores}
        onAddBelow={handleAddBelow}
        onAddAbove={handleAddAbove}
      />
    </div>
  );
}
