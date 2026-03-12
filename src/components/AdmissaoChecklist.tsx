import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmissaoDocumentos, useInvalidateAdmissaoDocumentos, DOCUMENTOS_OBRIGATORIOS, type AdmissaoDocumento } from "@/hooks/useAdmissaoDocumentos";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuthContext } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Upload, Trash2, RefreshCw, FileText, User, Clock } from "lucide-react";
import { toast } from "sonner";

interface AdmissaoChecklistProps {
  vaga: any;
  canEdit: boolean;
}

const formatUploadError = (err: unknown) => {
  if (!err) return "erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;

  const supabaseError = err as {
    message?: string;
    details?: string;
    error_description?: string;
    error?: string;
    statusCode?: string | number;
  };

  return (
    supabaseError.message ||
    supabaseError.details ||
    supabaseError.error_description ||
    supabaseError.error ||
    (supabaseError.statusCode ? `código ${supabaseError.statusCode}` : "erro desconhecido")
  );
};

const normalizeExtension = (fileName: string) => {
  const extension = fileName.includes(".") ? `.${fileName.split(".").pop()?.toLowerCase()}` : "";
  return extension;
};

const getAllowedFormats = (formatos: readonly string[]) => {
  const normalized = new Set(formatos.map((format) => format.toLowerCase()));

  if (normalized.has(".jpeg") || normalized.has(".jpg")) {
    normalized.add(".jpeg");
    normalized.add(".jpg");
    normalized.add(".jfif");
  }

  return normalized;
};

const sanitizeFileName = (fileName: string) =>
  fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_");

export function AdmissaoChecklist({ vaga, canEdit }: AdmissaoChecklistProps) {
  const { data: documentos = [], isLoading } = useAdmissaoDocumentos(vaga?.id || null);
  const invalidate = useInvalidateAdmissaoDocumentos();
  const { logAction } = useAuditLog();
  const { user, profile } = useAuthContext();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const getDocStatus = (tipo: string): AdmissaoDocumento | undefined =>
    documentos.find((d) => d.tipo_documento === tipo);

  // Documents received in the process
  const hasCV = !!vaga?.curriculo_nome;
  const hasASO = !!vaga?.resultado_aso_nome;

  const checklistCount = DOCUMENTOS_OBRIGATORIOS.length;
  const completedChecklist = DOCUMENTOS_OBRIGATORIOS.filter((d) => getDocStatus(d.tipo)?.status === "anexado").length;
  const processDocsCount = (hasCV ? 1 : 0) + (hasASO ? 1 : 0);
  const totalRequired = checklistCount + 2; // +CV +ASO
  const totalCompleted = completedChecklist + processDocsCount;
  const pendingCount = totalRequired - totalCompleted;

  const allComplete = pendingCount === 0;

  const handleUpload = async (tipo: string, formatos: readonly string[]) => {
    if (!vaga?.id) {
      toast.error("Não foi possível identificar a vaga para anexar o documento.");
      return;
    }

    const input = fileInputRefs.current[tipo];
    if (!input) return;

    const file = input.files?.[0];
    if (!file) return;

    const ext = normalizeExtension(file.name);
    const allowedFormats = getAllowedFormats(formatos);

    if (!allowedFormats.has(ext)) {
      toast.error(`Formato inválido. Formatos aceitos: ${formatos.join(", ")}`);
      input.value = "";
      return;
    }

    setUploading(tipo);
    const existing = getDocStatus(tipo);

    try {
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${vaga.id}/${tipo}/${crypto.randomUUID()}_${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("admissao-documentos")
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type || undefined,
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw uploadError;
      }

      const documentoPayload = {
        vaga_id: vaga.id,
        tipo_documento: tipo,
        arquivo_nome: file.name,
        arquivo_path: filePath,
        anexado_por: profile?.nome || "Sistema",
        anexado_por_id: user?.id || null,
        anexado_em: new Date().toISOString(),
        status: "anexado",
      };

      const { error: upsertError } = await supabase
        .from("admissao_documentos")
        .upsert(documentoPayload, { onConflict: "vaga_id,tipo_documento" });

      if (upsertError) {
        await supabase.storage.from("admissao-documentos").remove([filePath]);
        console.error("DB upsert error:", upsertError);
        throw upsertError;
      }

      if (existing?.arquivo_path && existing.arquivo_path !== filePath) {
        const { error: removeOldError } = await supabase.storage
          .from("admissao-documentos")
          .remove([existing.arquivo_path]);

        if (removeOldError) {
          console.warn("Erro ao remover arquivo anterior:", removeOldError);
        }
      }

      await logAction({
        modulo: "Dep. Pessoal",
        pagina: "Admissão",
        acao: existing ? "substituicao_documento" : "anexo_documento",
        descricao: `${existing ? "Substituiu" : "Anexou"} documento: ${DOCUMENTOS_OBRIGATORIOS.find((d) => d.tipo === tipo)?.label} para ${vaga.nome_candidato}`,
        registro_id: vaga.id,
        registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      toast.success("Documento anexado com sucesso!");
      invalidate(vaga.id);
    } catch (err: unknown) {
      const message = formatUploadError(err);
      console.error("Erro completo ao anexar:", err);
      toast.error(`Erro ao anexar documento: ${message}`);
    } finally {
      setUploading(null);
      input.value = "";
    }
  };

  const handleDelete = async (tipo: string) => {
    const doc = getDocStatus(tipo);
    if (!doc) return;

    try {
      if (doc.arquivo_path) {
        await supabase.storage.from("admissao-documentos").remove([doc.arquivo_path]);
      }
      const { error: updateError } = await supabase
        .from("admissao_documentos")
        .update({
          arquivo_nome: null,
          arquivo_path: null,
          anexado_por: null,
          anexado_por_id: null,
          anexado_em: null,
          status: "pendente",
        })
        .eq("id", doc.id);
      if (updateError) throw updateError;

      await logAction({
        modulo: "Dep. Pessoal", pagina: "Admissão", acao: "exclusao_documento",
        descricao: `Excluiu documento: ${DOCUMENTOS_OBRIGATORIOS.find(d => d.tipo === tipo)?.label} de ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });

      toast.success("Documento excluído.");
      invalidate(vaga.id);
    } catch {
      toast.error("Erro ao excluir documento.");
    }
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando checklist...</p>;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card className="border-primary/20">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Entregues: <strong className="text-green-700">{totalCompleted}</strong> de {totalRequired}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Pendentes: <strong className="text-red-600">{pendingCount}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Recebidos no processo: {hasCV ? "Currículo" : ""}{hasCV && hasASO ? " e " : ""}{hasASO ? "ASO" : ""}{!hasCV && !hasASO ? "Nenhum" : ""}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Documentos recebidos no processo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            {hasCV ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
            <span className="flex-1">Currículo</span>
            {hasCV && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{vaga.curriculo_nome}</Badge>}
            {!hasCV && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Pendente</Badge>}
          </div>
          <div className="flex items-center gap-3 text-sm">
            {hasASO ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
            <span className="flex-1">ASO</span>
            {hasASO && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">{vaga.resultado_aso_nome}</Badge>}
            {!hasASO && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Pendente</Badge>}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Checklist de Documentos para Admissão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {DOCUMENTOS_OBRIGATORIOS.map((doc) => {
            const status = getDocStatus(doc.tipo);
            const isAnexado = status?.status === "anexado";
            const isUploadingThis = uploading === doc.tipo;

            return (
              <div
                key={doc.tipo}
                className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${
                  isAnexado ? "bg-green-50/50 border-green-200" : "bg-red-50/30 border-red-200"
                }`}
              >
                {isAnexado ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium">{doc.label}</div>
                  <div className="text-xs text-muted-foreground">Formato: {doc.formatoLabel}</div>
                  {isAnexado && status && (
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />{status.arquivo_nome}
                      </span>
                      {status.anexado_por && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />{status.anexado_por}
                        </span>
                      )}
                      {status.anexado_em && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(status.anexado_em).toLocaleDateString("pt-BR")}{" "}
                          {new Date(status.anexado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[doc.tipo] = el; }}
                      className="hidden"
                      accept={doc.formatos.join(",")}
                      onChange={() => handleUpload(doc.tipo, doc.formatos)}
                    />
                    {isAnexado ? (
                      <>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => fileInputRefs.current[doc.tipo]?.click()}
                          disabled={isUploadingThis}
                          title="Substituir arquivo"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(doc.tipo)}
                          title="Excluir arquivo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => fileInputRefs.current[doc.tipo]?.click()}
                        disabled={isUploadingThis}
                      >
                        {isUploadingThis ? (
                          <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-1" />
                        )}
                        Anexar
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function useChecklistComplete(vaga: any) {
  const { data: documentos = [] } = useAdmissaoDocumentos(vaga?.id || null);
  
  const hasCV = !!vaga?.curriculo_nome;
  const hasASO = !!vaga?.resultado_aso_nome;
  const checklistComplete = DOCUMENTOS_OBRIGATORIOS.every(
    (d) => documentos.find((doc) => doc.tipo_documento === d.tipo)?.status === "anexado"
  );

  return hasCV && hasASO && checklistComplete;
}
