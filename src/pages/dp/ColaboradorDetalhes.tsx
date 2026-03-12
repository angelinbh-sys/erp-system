import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Download, User as UserIcon, FileText, History, Pencil } from "lucide-react";
import { formatFirstLastName } from "@/utils/formatName";
import { useColaboradorHistorico, type Colaborador } from "@/hooks/useColaboradores";
import { useAdmissaoDocumentos, DOCUMENTOS_OBRIGATORIOS } from "@/hooks/useAdmissaoDocumentos";
import { useVagaHistorico } from "@/hooks/useVagaHistorico";
import VagaTimeline from "@/components/VagaTimeline";
import { toast } from "@/lib/toast";

const ColaboradorDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [colaborador, setColaborador] = useState<Colaborador | null>(null);
  const [vaga, setVaga] = useState<any>(null);
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { data: historico = [] } = useColaboradorHistorico(id || null);
  const { data: documentos = [] } = useAdmissaoDocumentos(vaga?.id || null);
  const { data: vagaHistorico = [] } = useVagaHistorico(vaga?.id || null);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data: colab } = await supabase.from("colaboradores").select("*").eq("id", id).single();
      if (!colab) { setLoading(false); return; }
      setColaborador(colab as Colaborador);

      if (colab.vaga_id) {
        const { data: vagaData } = await supabase.from("vagas").select("*").eq("id", colab.vaga_id).single();
        if (vagaData) setVaga(vagaData);

        // Fetch foto
        const { data: fotoDoc } = await supabase
          .from("admissao_documentos")
          .select("arquivo_path")
          .eq("vaga_id", colab.vaga_id)
          .eq("tipo_documento", "foto_3x4")
          .eq("status", "anexado")
          .maybeSingle();
        if (fotoDoc?.arquivo_path) {
          const { data: urlData } = supabase.storage.from("admissao-documentos").getPublicUrl(fotoDoc.arquivo_path);
          if (urlData?.publicUrl) setFotoUrl(urlData.publicUrl);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const handleDownloadAll = async () => {
    if (!vaga?.id) return;
    const filesToDownload: { path: string; name: string }[] = [];

    for (const doc of documentos) {
      if (doc.status === "anexado" && doc.arquivo_path) {
        filesToDownload.push({ path: doc.arquivo_path, name: doc.arquivo_nome || doc.tipo_documento });
      }
    }

    if (vaga.resultado_aso_path) {
      filesToDownload.push({ path: vaga.resultado_aso_path, name: vaga.resultado_aso_nome || "resultado-aso" });
    }

    if (filesToDownload.length === 0) {
      toast.info("Nenhum arquivo disponível para download.");
      return;
    }

    toast.info(`Iniciando download de ${filesToDownload.length} arquivo(s)...`);

    for (const file of filesToDownload) {
      try {
        const bucket = file.path.includes("resultado-aso") ? "aso-documentos" : "admissao-documentos";
        const { data } = await supabase.storage.from(bucket).download(file.path);
        if (data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch {
        console.error("Erro ao baixar:", file.name);
      }
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!colaborador) return <div className="max-w-4xl mx-auto"><p className="text-muted-foreground">Colaborador não encontrado.</p></div>;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/departamento-pessoal/efetivo")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-heading text-2xl font-bold text-foreground">Detalhes do Colaborador</h2>
      </div>

      {/* Header with photo */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={fotoUrl || undefined} />
              <AvatarFallback className="text-2xl bg-muted">
                {fotoUrl ? getInitials(colaborador.nome) : <UserIcon className="h-10 w-10" />}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-foreground">{formatFirstLastName(colaborador.nome)}</h3>
              <p className="text-muted-foreground">{colaborador.cargo}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={colaborador.status === "Ativo" ? "default" : "secondary"}>{colaborador.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                <div><strong>Centro de Custo:</strong> {colaborador.centro_custo}</div>
                <div><strong>Site / Contrato:</strong> {colaborador.site_contrato}</div>
                <div><strong>Data de Admissão:</strong> {new Date(colaborador.data_admissao).toLocaleDateString("pt-BR")}</div>
                {colaborador.data_nascimento && <div><strong>Data de Nascimento:</strong> {new Date(colaborador.data_nascimento).toLocaleDateString("pt-BR")}</div>}
                {colaborador.telefone && <div><strong>Telefone:</strong> {colaborador.telefone}</div>}
                {vaga?.cpf && <div><strong>CPF:</strong> {vaga.cpf}</div>}
                {vaga?.sexo && <div><strong>Sexo:</strong> {vaga.sexo}</div>}
                {vaga?.salario && <div><strong>Salário:</strong> {vaga.salario}</div>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bank Data */}
      {vaga && (vaga.agencia || vaga.conta) && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">🏦 Dados Bancários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><strong>Agência:</strong> {vaga.agencia}{vaga.digito_agencia ? `-${vaga.digito_agencia}` : ""}</div>
              <div><strong>Conta:</strong> {vaga.conta}{vaga.digito_conta ? `-${vaga.digito_conta}` : ""}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {vaga && documentos.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">📋 Documentos Anexados</CardTitle>
              <Button variant="outline" size="sm" onClick={handleDownloadAll}>
                <Download className="h-4 w-4 mr-1" /> Baixar Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {DOCUMENTOS_OBRIGATORIOS.map((doc) => {
              const status = documentos.find((d) => d.tipo_documento === doc.tipo);
              const isAnexado = status?.status === "anexado";
              return (
                <div key={doc.tipo} className={`flex items-center gap-3 p-2 rounded text-sm ${isAnexado ? "bg-green-50/50" : "bg-muted/30"}`}>
                  <FileText className={`h-4 w-4 ${isAnexado ? "text-green-600" : "text-muted-foreground"}`} />
                  <span className="flex-1">{doc.label}</span>
                  <Badge variant="outline" className={isAnexado ? "bg-green-50 text-green-700 border-green-200 text-xs" : "text-xs"}>
                    {isAnexado ? "Anexado" : "Pendente"}
                  </Badge>
                </div>
              );
            })}
            {vaga.curriculo_nome && (
              <div className="flex items-center gap-3 p-2 rounded text-sm bg-green-50/50">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="flex-1">Currículo</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Anexado</Badge>
              </div>
            )}
            {vaga.resultado_aso_nome && (
              <div className="flex items-center gap-3 p-2 rounded text-sm bg-green-50/50">
                <FileText className="h-4 w-4 text-green-600" />
                <span className="flex-1">ASO</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">Anexado</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Vaga Timeline */}
      {vaga && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Fluxo da Vaga</CardTitle>
          </CardHeader>
          <CardContent>
            <VagaTimeline vaga={vaga} historico={vagaHistorico} />
          </CardContent>
        </Card>
      )}

      {/* Histórico de Alterações */}
      {historico.length > 0 && (
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <History className="h-4 w-4" /> Histórico de Alterações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {historico.map((h) => (
              <div key={h.id} className="border border-border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{h.campo_alterado}</span>
                  <span className="text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-muted-foreground"><span className="line-through">{h.valor_anterior || "—"}</span> → {h.valor_novo || "—"}</p>
                <p className="text-xs text-muted-foreground mt-1">Motivo: {h.motivo}</p>
                <p className="text-xs text-muted-foreground">Por: {formatFirstLastName(h.alterado_por)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ColaboradorDetalhes;
