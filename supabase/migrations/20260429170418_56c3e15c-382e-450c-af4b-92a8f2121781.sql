
INSERT INTO storage.buckets (id, name, public)
VALUES ('vagas-arquivos', 'vagas-arquivos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can view vagas-arquivos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'vagas-arquivos');

CREATE POLICY "Authenticated can upload vagas-arquivos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'vagas-arquivos');

CREATE POLICY "Authenticated can update vagas-arquivos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'vagas-arquivos');

CREATE POLICY "Authenticated can delete vagas-arquivos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'vagas-arquivos');

ALTER TABLE public.vagas
  ADD COLUMN IF NOT EXISTS curriculo_path TEXT,
  ADD COLUMN IF NOT EXISTS documento_path TEXT;
