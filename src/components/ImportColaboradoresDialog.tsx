import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Pencil, X, Check, AlertTriangle } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import { parseExcelFile, insertColaboradores, revalidateRow, type ImportRow } from "@/utils/colaboradorExcel";
import { useQueryClient } from "@tanstack/react-query";
import { useAuditLog } from "@/hooks/useAuditLog";
import { capitalizeName } from "@/utils/formatName";
import { formatCPF } from "@/utils/cpf";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EDITABLE_FIELDS: { key: string; label: string; type?: "select"; options?: string[] }[] = [
  { key: "nome", label: "Nome Completo" },
  { key: "cpf", label: "CPF" },
  { key: "data_nascimento", label: "Data de Nascimento" },
  { key: "sexo", label: "Sexo", type: "select", options: ["Masculino", "Feminino"] },
  { key: "telefone", label: "Telefone" },
  { key: "cargo", label: "Cargo / Função" },
  { key: "centro_custo", label: "Centro de Custo" },
  { key: "contrato", label: "Contrato" },
  { key: "site_contrato", label: "Site" },
  { key: "data_admissao", label: "Data de Admissão" },
  { key: "status", label: "Status", type: "select", options: ["Ativo", "Inativo", "Afastado", "Desligado"] },
];

const FIELD_LABEL_MAP: Record<string, string> = {
  nome: "Nome Completo",
  cpf: "CPF",
  data_nascimento: "Data de Nascimento",
  sexo: "Sexo",
  telefone: "Telefone",
  cargo: "Cargo / Função",
  centro_custo: "Centro de Custo",
  contrato: "Contrato",
  site_contrato: "Site",
  data_admissao: "Data de Admissão",
  status: "Status",
};

function parseErrorField(erro: string): { campo: string; descricao: string } {
  if (erro.includes("Nome Completo")) return { campo: "Nome Completo", descricao: erro };
  if (erro.includes("CPF")) return { campo: "CPF", descricao: erro };
  if (erro.includes("Sexo")) return { campo: "Sexo", descricao: erro };
  if (erro.includes("Data de Nascimento")) return { campo: "Data de Nascimento", descricao: erro };
  if (erro.includes("Cargo")) return { campo: "Cargo / Função", descricao: erro };
  if (erro.includes("Contrato")) return { campo: "Contrato", descricao: erro };
  if (erro.includes("Site")) return { campo: "Site", descricao: erro };
  if (erro.includes("Status")) return { campo: "Status", descricao: erro };
  return { campo: "—", descricao: erro };
}

function getFieldKeyFromLabel(campo: string): string | null {
  const entry = Object.entries(FIELD_LABEL_MAP).find(([, label]) => label === campo);
  return entry ? entry[0] : null;
}

export default function ImportColaboradoresDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const [editingLinha, setEditingLinha] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [showErrorDetail, setShowErrorDetail] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const reset = () => {
    setStep("upload");
    setRows([]);
    setResultMsg("");
    setImporting(false);
    setEditingLinha(null);
    setEditForm({});
    setShowErrorDetail(false);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.xlsx?$/i)) {
      toast.error("Arquivo inválido. Selecione um arquivo Excel (.xlsx).");
      return;
    }
    try {
      const parsed = await parseExcelFile(file);
      if (parsed.length === 0) {
        toast.error("Nenhum registro encontrado na planilha.");
        return;
      }
      setRows(parsed);
      setStep("review");
    } catch {
      toast.error("Erro ao processar o arquivo.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const validos = rows.filter((r) => r.valido).length;
  const comErro = rows.filter((r) => !r.valido).length;
  const rowsComErro = rows.filter((r) => !r.valido);

  const startEditing = (row: ImportRow) => {
    setEditingLinha(row.linha);
    setEditForm({ ...row.dados });
  };

  const cancelEditing = () => {
    setEditingLinha(null);
    setEditForm({});
  };

  const saveEditing = () => {
    if (editingLinha == null) return;

    const updatedDados = {
      ...editForm,
      nome: capitalizeName(editForm.nome || ""),
      cpf: editForm.cpf ? formatCPF(editForm.cpf.replace(/\D/g, "")) : "",
      cargo: capitalizeName(editForm.cargo || ""),
    };

    const erros = revalidateRow(updatedDados);

    setRows((prev) =>
      prev.map((r) =>
        r.linha === editingLinha
          ? { ...r, dados: updatedDados, erros, valido: erros.length === 0 }
          : r
      )
    );
    setEditingLinha(null);
    setEditForm({});

    if (erros.length === 0) {
      toast.success("Registro corrigido com sucesso!");
    } else {
      toast.error(`Ainda há ${erros.length} erro(s) neste registro.`);
    }
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const { inserted } = await insertColaboradores(rows);
      await logAction({
        modulo: "Dep. Pessoal",
        pagina: "Efetivo",
        acao: "importacao",
        descricao: `Importação em lote: ${inserted} colaboradores importados, ${comErro} com erro.`,
      });
      queryClient.invalidateQueries({ queryKey: ["colaboradores"] });
      setResultMsg(`${inserted} colaborador(es) importado(s) com sucesso.${comErro > 0 ? ` ${comErro} linha(s) com erro foram ignoradas.` : ""}`);
      setStep("done");
    } catch {
      toast.error("Erro ao importar colaboradores.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" /> Importar Colaboradores
            </DialogTitle>
          </DialogHeader>

          {step === "upload" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <FileSpreadsheet className="h-16 w-16 text-muted-foreground" />
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Selecione um arquivo Excel (.xlsx) seguindo o modelo de importação.
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFile}
              />
              <Button onClick={() => fileRef.current?.click()}>
                Selecionar arquivo
              </Button>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4 flex-1 min-h-0 flex flex-col">
              <div className="flex gap-4 text-sm flex-wrap">
                <Badge variant="outline">Registros: {rows.length}</Badge>
                <Badge variant="default" className="bg-green-600">Válidos: {validos}</Badge>
                {comErro > 0 && (
                  <Badge
                    variant="destructive"
                    className="cursor-pointer hover:opacity-80 transition-opacity underline"
                    onClick={() => setShowErrorDetail(true)}
                  >
                    Com erro: {comErro} — Ver detalhes
                  </Badge>
                )}
              </div>

              <ScrollArea className="flex-1 border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Linha</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead className="w-16">Status</TableHead>
                      <TableHead>Erros</TableHead>
                      <TableHead className="w-20">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.linha} className={r.valido ? "" : "bg-destructive/5"}>
                        {editingLinha === r.linha ? (
                          <TableCell colSpan={6} className="p-0">
                            <div className="p-4 space-y-3 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">Corrigir linha {r.linha}</span>
                                <div className="flex gap-1">
                                  <Button size="sm" variant="ghost" onClick={cancelEditing} className="h-7 px-2">
                                    <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                                  </Button>
                                  <Button size="sm" onClick={saveEditing} className="h-7 px-2">
                                    <Check className="h-3.5 w-3.5 mr-1" /> Salvar
                                  </Button>
                                </div>
                              </div>
                              {r.erros.length > 0 && (
                                <div className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-1.5">
                                  {r.erros.join(" • ")}
                                </div>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {EDITABLE_FIELDS.map((f) => (
                                  <div key={f.key}>
                                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                                    {f.type === "select" ? (
                                      <Select
                                        value={editForm[f.key] || ""}
                                        onValueChange={(v) => setEditForm((p) => ({ ...p, [f.key]: v }))}
                                      >
                                        <SelectTrigger className="h-8 text-sm mt-0.5">
                                          <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {f.options!.map((o) => (
                                            <SelectItem key={o} value={o}>{o}</SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Input
                                        className="h-8 text-sm mt-0.5"
                                        value={editForm[f.key] || ""}
                                        onChange={(e) =>
                                          setEditForm((p) => ({ ...p, [f.key]: e.target.value }))
                                        }
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        ) : (
                          <>
                            <TableCell>{r.linha}</TableCell>
                            <TableCell className="font-medium">{r.dados.nome || "—"}</TableCell>
                            <TableCell>{r.dados.cpf || "—"}</TableCell>
                            <TableCell>
                              {r.valido ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-destructive max-w-48">
                              {r.erros.join("; ")}
                            </TableCell>
                            <TableCell>
                              {!r.valido && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditing(r)}
                                  className="h-7 px-2 text-xs"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" /> Corrigir
                                </Button>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              <DialogFooter>
                <Button variant="outline" onClick={() => handleClose(false)}>Cancelar</Button>
                <Button onClick={handleImport} disabled={importing || validos === 0}>
                  {importing ? "Importando..." : `Importar ${validos} registro(s)`}
                </Button>
              </DialogFooter>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <p className="text-sm text-center text-foreground">{resultMsg}</p>
              <Button onClick={() => handleClose(false)}>Fechar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de detalhes dos erros */}
      <Dialog open={showErrorDetail} onOpenChange={setShowErrorDetail}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Detalhes dos Registros com Erro
            </DialogTitle>
          </DialogHeader>

          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-sm text-foreground">
            <p>
              Existem <strong>{comErro}</strong> registro(s) com erro na planilha.
              Corrija os itens abaixo e importe novamente para concluir o processo sem inconsistências.
            </p>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-3 pr-3">
              {rowsComErro.map((r) => (
                <div key={r.linha} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">Linha {r.linha}</Badge>
                      <span className="text-sm font-medium">{r.dados.nome || "Nome não informado"}</span>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {r.erros.length} erro(s)
                    </Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40 text-xs">Campo</TableHead>
                        <TableHead className="text-xs">Erro</TableHead>
                        <TableHead className="w-48 text-xs">Valor informado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {r.erros.map((erro, i) => {
                        const parsed = parseErrorField(erro);
                        const fieldKey = getFieldKeyFromLabel(parsed.campo);
                        const valor = fieldKey ? (r.dados[fieldKey] || "vazio") : "—";
                        return (
                          <TableRow key={i}>
                            <TableCell className="text-sm font-medium">{parsed.campo}</TableCell>
                            <TableCell className="text-sm text-destructive">{parsed.descricao}</TableCell>
                            <TableCell className="text-sm text-muted-foreground italic">{valor}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowErrorDetail(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
