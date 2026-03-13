import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmissaoDocumentos, useInvalidateAdmissaoDocumentos, DOCUMENTOS_OBRIGATORIOS, getDocumentosObrigatorios, type AdmissaoDocumento } from "@/hooks/useAdmissaoDocumentos";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuthContext } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Upload, Trash2, RefreshCw, FileText, User, Clock } from "lucide-react";
import { toast } from "@/lib/toast";
import { formatFirstLastName } from "@/utils/formatName";
import { useQueryClient } from "@tanstack/react-query";

interface AdmissaoChecklistProps {
  vaga: any;
  canEdit: boolean;
  onBankDataSaved?: (data: Partial<BankDataState>) => void;
}

const formatUploadError = (err: unknown) => {
  if (!err) return "erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  const supabaseError = err as { message?: string; details?: string; error_description?: string; error?: string; statusCode?: string | number };
  return supabaseError.message || supabaseError.details || supabaseError.error_description || supabaseError.error || (supabaseError.statusCode ? `código ${supabaseError.statusCode}` : "erro desconhecido");
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
  fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");

interface BankDataState {
  banco: string;
  agencia: string;
  digito_agencia: string;
  conta: string;
  digito_conta: string;
}

function BankDataFields({ vaga, canEdit, onSaved }: { vaga: any; canEdit: boolean; onSaved?: (data: Partial<BankDataState>) => void }) {
  const queryClient = useQueryClient();
  const [bankData, setBankData] = useState<BankDataState>({
    banco: vaga?.banco || "",
    agencia: vaga?.agencia || "",
    digito_agencia: vaga?.digito_agencia || "",
    conta: vaga?.conta || "",
    digito_conta: vaga?.digito_conta || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBankData({
      banco: vaga?.banco || "",
      agencia: vaga?.agencia || "",
      digito_agencia: vaga?.digito_agencia || "",
      conta: vaga?.conta || "",
      digito_conta: vaga?.digito_conta || "",
    });
  }, [vaga?.banco, vaga?.agencia, vaga?.digito_agencia, vaga?.conta, vaga?.digito_conta]);

  const onlyDigits = (value: string, max: number) => value.replace(/\D/g, "").slice(0, max);

  const handleSave = async () => {
    if (!bankData.banco.trim()) { toast.error("Banco é obrigatório."); return; }
    if (!bankData.agencia.trim()) { toast.error("Agência é obrigatório."); return; }
    if (!bankData.conta.trim()) { toast.error("Conta é obrigatório."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("vagas").update({
        banco: bankData.banco,
        agencia: bankData.agencia,
        digito_agencia: bankData.digito_agencia || null,
        conta: bankData.conta,
        digito_conta: bankData.digito_conta || null,
      } as any).eq("id", vaga.id);
      if (error) throw error;
      toast.success("Dados bancários salvos com sucesso!");
      onSaved?.({
        banco: bankData.banco,
        agencia: bankData.agencia,
        digito_agencia: bankData.digito_agencia,
        conta: bankData.conta,
        digito_conta: bankData.digito_conta,
      });
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
    } catch {
      toast.error("Erro ao salvar dados bancários.");
    } finally {
      setSaving(false);
    }
  };

  const hasSavedData = vaga?.banco && vaga?.agencia && vaga?.conta;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          🏦 Dados Bancários
          {hasSavedData && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Preenchido</Badge>}
          {!hasSavedData && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Pendente</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Banco *</Label>
            <Input
              placeholder="Nome do banco"
              value={bankData.banco}
              onChange={(e) => setBankData(prev => ({ ...prev, banco: e.target.value }))}
              disabled={!canEdit}
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">Agência *</Label>
              <Input
                placeholder="000000"
                value={bankData.agencia}
                onChange={(e) => setBankData(prev => ({ ...prev, agencia: onlyDigits(e.target.value, 6) }))}
                disabled={!canEdit}
                maxLength={6}
              />
            </div>
            <div className="w-16">
              <Label className="text-xs">Dígito</Label>
              <Input
                placeholder="0"
                value={bankData.digito_agencia}
                onChange={(e) => setBankData(prev => ({ ...prev, digito_agencia: onlyDigits(e.target.value, 2) }))}
                disabled={!canEdit}
                maxLength={2}
              />
            </div>
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <Label className="text-xs">Conta *</Label>
              <Input
                placeholder="00000000"
                value={bankData.conta}
                onChange={(e) => setBankData(prev => ({ ...prev, conta: onlyDigits(e.target.value, 8) }))}
                disabled={!canEdit}
                maxLength={8}
              />
            </div>
            <div className="w-16">
              <Label className="text-xs">Dígito</Label>
              <Input
                placeholder="0"
                value={bankData.digito_conta}
                onChange={(e) => setBankData(prev => ({ ...prev, digito_conta: onlyDigits(e.target.value, 2) }))}
                disabled={!canEdit}
                maxLength={2}
              />
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Dados Bancários"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AddressState {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  numero: string;
  complemento: string;
}

function AddressFields({ vaga, canEdit, onSaved }: { vaga: any; canEdit: boolean; onSaved?: (data: any) => void }) {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState<AddressState>({
    cep: vaga?.cep || "",
    logradouro: vaga?.logradouro || "",
    bairro: vaga?.bairro || "",
    cidade: vaga?.cidade || "",
    estado: vaga?.estado || "",
    numero: vaga?.numero || "",
    complemento: vaga?.complemento || "",
  });
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setAddress({
      cep: vaga?.cep || "",
      logradouro: vaga?.logradouro || "",
      bairro: vaga?.bairro || "",
      cidade: vaga?.cidade || "",
      estado: vaga?.estado || "",
      numero: vaga?.numero || "",
      complemento: vaga?.complemento || "",
    });
  }, [vaga?.cep, vaga?.logradouro, vaga?.bairro, vaga?.cidade, vaga?.estado, vaga?.numero, vaga?.complemento]);

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const fetchCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setFetching(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }));
      }
    } catch {
      // silently fail, user can fill manually
    } finally {
      setFetching(false);
    }
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setAddress(prev => ({ ...prev, cep: formatted }));
    if (formatted.replace(/\D/g, "").length === 8) {
      fetchCep(formatted);
    }
  };

  const handleSave = async () => {
    if (!address.cep.trim()) { toast.error("CEP é obrigatório."); return; }
    if (!address.numero.trim()) { toast.error("Número é obrigatório."); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from("vagas").update({
        cep: address.cep,
        logradouro: address.logradouro,
        bairro: address.bairro,
        cidade: address.cidade,
        estado: address.estado,
        numero: address.numero,
        complemento: address.complemento || null,
      } as any).eq("id", vaga.id);
      if (error) throw error;
      toast.success("Endereço salvo com sucesso!");
      onSaved?.({ ...address });
      queryClient.invalidateQueries({ queryKey: ["vagas"] });
    } catch {
      toast.error("Erro ao salvar endereço.");
    } finally {
      setSaving(false);
    }
  };

  const hasSavedData = vaga?.cep && vaga?.numero;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          📍 Endereço do Colaborador
          {hasSavedData && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Preenchido</Badge>}
          {!hasSavedData && <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">Pendente</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Label className="text-xs">CEP *</Label>
              <Input
                placeholder="00000-000"
                value={address.cep}
                onChange={(e) => handleCepChange(e.target.value)}
                disabled={!canEdit}
                maxLength={9}
              />
            </div>
            {fetching && <p className="text-xs text-muted-foreground pb-2">Buscando...</p>}
          </div>
          <div>
            <Label className="text-xs">Logradouro</Label>
            <Input
              placeholder="Rua, Avenida..."
              value={address.logradouro}
              onChange={(e) => setAddress(prev => ({ ...prev, logradouro: e.target.value }))}
              disabled={!canEdit}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Número *</Label>
              <Input
                placeholder="Nº"
                value={address.numero}
                onChange={(e) => setAddress(prev => ({ ...prev, numero: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Complemento</Label>
              <Input
                placeholder="Apto, Bloco..."
                value={address.complemento}
                onChange={(e) => setAddress(prev => ({ ...prev, complemento: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Bairro</Label>
            <Input
              placeholder="Bairro"
              value={address.bairro}
              onChange={(e) => setAddress(prev => ({ ...prev, bairro: e.target.value }))}
              disabled={!canEdit}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Cidade</Label>
              <Input
                placeholder="Cidade"
                value={address.cidade}
                onChange={(e) => setAddress(prev => ({ ...prev, cidade: e.target.value }))}
                disabled={!canEdit}
              />
            </div>
            <div>
              <Label className="text-xs">Estado</Label>
              <Input
                placeholder="UF"
                value={address.estado}
                onChange={(e) => setAddress(prev => ({ ...prev, estado: e.target.value }))}
                disabled={!canEdit}
                maxLength={2}
              />
            </div>
          </div>
        </div>
        {canEdit && (
          <div className="mt-3 flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

export function AdmissaoChecklist({ vaga, canEdit, onBankDataSaved }: AdmissaoChecklistProps) {
  const { data: documentos = [], isLoading } = useAdmissaoDocumentos(vaga?.id || null);
  const invalidate = useInvalidateAdmissaoDocumentos();
  const { logAction } = useAuditLog();
  const { user, profile } = useAuthContext();
  const [uploading, setUploading] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const sexo = vaga?.sexo as string | undefined;
  const documentosObrigatorios = getDocumentosObrigatorios(sexo);

  const getDocStatus = (tipo: string): AdmissaoDocumento | undefined =>
    documentos.find((d) => d.tipo_documento === tipo);

  const hasCV = !!vaga?.curriculo_nome;
  const hasASO = !!vaga?.resultado_aso_nome;
  const hasBankData = !!(vaga?.banco && vaga?.agencia && vaga?.conta);
  const hasAddress = !!(vaga?.cep && vaga?.numero);

  const checklistCount = documentosObrigatorios.length;
  const completedChecklist = documentosObrigatorios.filter((d) => getDocStatus(d.tipo)?.status === "anexado").length;
  const processDocsCount = (hasCV ? 1 : 0) + (hasASO ? 1 : 0);
  const totalRequired = checklistCount + 2 + 1 + 1; // +CV +ASO +BankData +Address
  const totalCompleted = completedChecklist + processDocsCount + (hasBankData ? 1 : 0) + (hasAddress ? 1 : 0);
  const pendingCount = totalRequired - totalCompleted;

  const handleUpload = async (tipo: string, formatos: readonly string[]) => {
    if (!vaga?.id) { toast.error("Não foi possível identificar a vaga para anexar o documento."); return; }
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
      const { error: uploadError } = await supabase.storage.from("admissao-documentos").upload(filePath, file, { upsert: true, contentType: file.type || undefined });
      if (uploadError) { console.error("Storage upload error:", uploadError); throw uploadError; }

      const documentoPayload = {
        vaga_id: vaga.id, tipo_documento: tipo,
        arquivo_nome: file.name, arquivo_path: filePath,
        anexado_por: formatFirstLastName(profile?.nome) || "Sistema",
        anexado_por_id: user?.id || null,
        anexado_em: new Date().toISOString(), status: "anexado",
      };

      const { error: upsertError } = await supabase.from("admissao_documentos").upsert(documentoPayload, { onConflict: "vaga_id,tipo_documento" });
      if (upsertError) {
        await supabase.storage.from("admissao-documentos").remove([filePath]);
        console.error("DB upsert error:", upsertError);
        throw upsertError;
      }

      if (existing?.arquivo_path && existing.arquivo_path !== filePath) {
        await supabase.storage.from("admissao-documentos").remove([existing.arquivo_path]).catch(console.warn);
      }

      await logAction({
        modulo: "Dep. Pessoal", pagina: "Admissão",
        acao: existing ? "substituicao_documento" : "anexo_documento",
        descricao: `${existing ? "Substituiu" : "Anexou"} documento: ${DOCUMENTOS_OBRIGATORIOS.find((d) => d.tipo === tipo)?.label} para ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
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
      if (doc.arquivo_path) await supabase.storage.from("admissao-documentos").remove([doc.arquivo_path]);
      const { error: updateError } = await supabase.from("admissao_documentos").update({
        arquivo_nome: null, arquivo_path: null, anexado_por: null, anexado_por_id: null, anexado_em: null, status: "pendente",
      }).eq("id", doc.id);
      if (updateError) throw updateError;

      await logAction({
        modulo: "Dep. Pessoal", pagina: "Admissão", acao: "exclusao_documento",
        descricao: `Excluiu documento: ${DOCUMENTOS_OBRIGATORIOS.find(d => d.tipo === tipo)?.label} de ${vaga.nome_candidato}`,
        registro_id: vaga.id, registro_ref: `${vaga.cargo} - ${vaga.nome_candidato}`,
      });
      toast.success("Documento excluído.");
      invalidate(vaga.id);
    } catch { toast.error("Erro ao excluir documento."); }
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

      {/* Bank Data Fields */}
      <BankDataFields vaga={vaga} canEdit={canEdit} onSaved={onBankDataSaved} />

      {/* Address Fields */}
      <AddressFields vaga={vaga} canEdit={canEdit} onSaved={onBankDataSaved} />

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
          {documentosObrigatorios.map((doc) => {
            const status = getDocStatus(doc.tipo);
            const isAnexado = status?.status === "anexado";
            const isUploadingThis = uploading === doc.tipo;

            return (
              <div key={doc.tipo} className={`flex items-center gap-3 p-3 rounded-lg border text-sm ${isAnexado ? "bg-green-50/50 border-green-200" : "bg-red-50/30 border-red-200"}`}>
                {isAnexado ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{doc.label}</div>
                  <div className="text-xs text-muted-foreground">Formato: {doc.formatoLabel}</div>
                  {isAnexado && status && (
                    <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-3">
                      <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{status.arquivo_nome}</span>
                      {status.anexado_por && <span className="flex items-center gap-1"><User className="h-3 w-3" />{formatFirstLastName(status.anexado_por)}</span>}
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
                    <input type="file" ref={(el) => { fileInputRefs.current[doc.tipo] = el; }} className="hidden" accept={doc.formatos.join(",")} onChange={() => handleUpload(doc.tipo, doc.formatos)} />
                    {isAnexado ? (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fileInputRefs.current[doc.tipo]?.click()} disabled={isUploadingThis} title="Substituir arquivo">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(doc.tipo)} title="Excluir arquivo">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => fileInputRefs.current[doc.tipo]?.click()} disabled={isUploadingThis}>
                        {isUploadingThis ? <RefreshCw className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
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
  const documentosObrigatorios = getDocumentosObrigatorios(vaga?.sexo);
  
  const hasCV = !!vaga?.curriculo_nome;
  const hasASO = !!vaga?.resultado_aso_nome;
  const hasBankData = !!(vaga?.banco && vaga?.agencia && vaga?.conta);
  const hasAddress = !!(vaga?.cep && vaga?.numero);
  const checklistComplete = documentosObrigatorios.every(
    (d) => documentos.find((doc) => doc.tipo_documento === d.tipo)?.status === "anexado"
  );

  return hasCV && hasASO && hasBankData && hasAddress && checklistComplete;
}
