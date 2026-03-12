import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdmissaoDocumento {
  id: string;
  vaga_id: string;
  tipo_documento: string;
  arquivo_nome: string | null;
  arquivo_path: string | null;
  anexado_por: string | null;
  anexado_por_id: string | null;
  anexado_em: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export const DOCUMENTOS_OBRIGATORIOS = [
  { tipo: "dados_bancarios", label: "Dados Bancários", formatos: [".jpeg", ".jpg", ".jfif"], formatoLabel: "JPEG" },
  { tipo: "ctps_digital", label: "CTPS Digital", formatos: [".pdf"], formatoLabel: "PDF" },
  { tipo: "cpf", label: "CPF", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
  { tipo: "rg", label: "RG", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
  { tipo: "foto_3x4", label: "Foto 3x4", formatos: [".jpeg", ".jpg", ".jfif"], formatoLabel: "JPEG" },
  { tipo: "titulo_eleitor", label: "Título de Eleitor", formatos: [".pdf"], formatoLabel: "PDF" },
  { tipo: "certidao_quitacao_eleitoral", label: "Certidão de Quitação Eleitoral", formatos: [".pdf"], formatoLabel: "PDF" },
  { tipo: "pis", label: "PIS", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
  { tipo: "certificado_reservista", label: "Certificado de Reservista", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
  { tipo: "comprovante_residencia", label: "Comprovante de Residência", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
  { tipo: "comprovante_escolaridade", label: "Comprovante de Escolaridade", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
  { tipo: "certidao_nascimento", label: "Certidão de Nascimento", formatos: [".pdf", ".jpeg", ".jpg", ".jfif"], formatoLabel: "PDF ou JPEG" },
] as const;

export function useAdmissaoDocumentos(vagaId: string | null) {
  return useQuery({
    queryKey: ["admissao_documentos", vagaId],
    enabled: !!vagaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admissao_documentos")
        .select("*")
        .eq("vaga_id", vagaId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as AdmissaoDocumento[];
    },
  });
}

export function useInvalidateAdmissaoDocumentos() {
  const queryClient = useQueryClient();
  return (vagaId: string) => {
    queryClient.invalidateQueries({ queryKey: ["admissao_documentos", vagaId] });
  };
}
