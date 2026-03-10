
CREATE TABLE public.vagas_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid NOT NULL REFERENCES public.vagas(id) ON DELETE CASCADE,
  acao text NOT NULL,
  usuario_nome text NOT NULL,
  motivo text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.vagas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view vagas_historico"
  ON public.vagas_historico FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert vagas_historico"
  ON public.vagas_historico FOR INSERT TO authenticated
  WITH CHECK (true);
