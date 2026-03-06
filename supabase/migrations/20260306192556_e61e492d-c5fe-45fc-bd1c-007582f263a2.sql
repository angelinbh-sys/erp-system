
-- Add ASO-related columns to vagas table
ALTER TABLE public.vagas 
  ADD COLUMN IF NOT EXISTS data_agendamento_aso date,
  ADD COLUMN IF NOT EXISTS data_entrega_aso date,
  ADD COLUMN IF NOT EXISTS resultado_aso_nome text,
  ADD COLUMN IF NOT EXISTS resultado_aso_path text,
  ADD COLUMN IF NOT EXISTS enviado_admissao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enviado_admissao_at timestamp with time zone;

-- Create storage bucket for ASO documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('aso-documentos', 'aso-documentos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for aso-documentos bucket
CREATE POLICY "Authenticated users can upload ASO docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'aso-documentos');

CREATE POLICY "Authenticated users can view ASO docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'aso-documentos');

CREATE POLICY "Authenticated users can update ASO docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'aso-documentos');

CREATE POLICY "Authenticated users can delete ASO docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'aso-documentos');
