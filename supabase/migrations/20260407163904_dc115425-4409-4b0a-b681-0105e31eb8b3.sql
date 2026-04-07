
CREATE TABLE public.frequencia (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  colaborador_id UUID NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Presente',
  observacao TEXT,
  registrado_por TEXT,
  registrado_por_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(colaborador_id, data)
);

ALTER TABLE public.frequencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view frequencia" ON public.frequencia FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert frequencia" ON public.frequencia FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update frequencia" ON public.frequencia FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete frequencia" ON public.frequencia FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_frequencia_updated_at
  BEFORE UPDATE ON public.frequencia
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_frequencia_colaborador ON public.frequencia(colaborador_id);
CREATE INDEX idx_frequencia_data ON public.frequencia(data);
CREATE INDEX idx_frequencia_status ON public.frequencia(status);
