
-- Add RLS policies for storage.objects on admissao-documentos bucket
CREATE POLICY "Authenticated can upload admissao-documentos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'admissao-documentos');

CREATE POLICY "Authenticated can update admissao-documentos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'admissao-documentos');

CREATE POLICY "Authenticated can delete admissao-documentos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'admissao-documentos');

CREATE POLICY "Authenticated can view admissao-documentos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'admissao-documentos');
