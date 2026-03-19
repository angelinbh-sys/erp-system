import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "@/lib/toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import { parseExcelFile, insertColaboradores, type ImportRow } from "@/utils/colaboradorExcel";
import { useQueryClient } from "@tanstack/react-query";
import { useAuditLog } from "@/hooks/useAuditLog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportColaboradoresDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"upload" | "review" | "done">("upload");
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [resultMsg, setResultMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const reset = () => {
    setStep("upload");
    setRows([]);
    setResultMsg("");
    setImporting(false);
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
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
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <Badge variant="outline">Registros encontrados: {rows.length}</Badge>
              <Badge variant="default" className="bg-green-600">Válidos: {validos}</Badge>
              {comErro > 0 && <Badge variant="destructive">Com erro: {comErro}</Badge>}
            </div>

            <ScrollArea className="max-h-72 border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Linha</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.linha} className={r.valido ? "" : "bg-destructive/5"}>
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
  );
}
