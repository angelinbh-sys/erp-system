CREATE TABLE public.grupos_permissao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  permissoes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grupos_permissao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view grupos_permissao"
  ON public.grupos_permissao FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert grupos_permissao"
  ON public.grupos_permissao FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update grupos_permissao"
  ON public.grupos_permissao FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated can delete grupos_permissao"
  ON public.grupos_permissao FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_grupos_permissao_updated_at
  BEFORE UPDATE ON public.grupos_permissao
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();