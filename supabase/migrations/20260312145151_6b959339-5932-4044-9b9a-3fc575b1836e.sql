
-- Table for admission document checklist
CREATE TABLE public.admissao_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vaga_id UUID NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  arquivo_nome TEXT,
  arquivo_path TEXT,
  anexado_por TEXT,
  anexado_por_id UUID,
  anexado_em TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vaga_id, tipo_documento)
);

-- RLS
ALTER TABLE public.admissao_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view admissao_documentos" ON public.admissao_documentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert admissao_documentos" ON public.admissao_documentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update admissao_documentos" ON public.admissao_documentos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete admissao_documentos" ON public.admissao_documentos FOR DELETE TO authenticated USING (true);

-- Storage bucket for admission documents
INSERT INTO storage.buckets (id, name, public) VALUES ('admissao-documentos', 'admissao-documentos', false);

-- Storage RLS policies
CREATE POLICY "Authenticated can upload admissao docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'admissao-documentos');
CREATE POLICY "Authenticated can view admissao docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'admissao-documentos');
CREATE POLICY "Authenticated can delete admissao docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'admissao-documentos');
CREATE POLICY "Authenticated can update admissao docs" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'admissao-documentos');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.admissao_documentos;
