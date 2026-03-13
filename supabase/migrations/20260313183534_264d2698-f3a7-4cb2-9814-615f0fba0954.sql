
-- Tabela de contratos
CREATE TABLE public.contratos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_contrato text NOT NULL,
  cliente text NOT NULL,
  projeto_obra text NOT NULL,
  valor_contrato numeric(15,2) NOT NULL DEFAULT 0,
  data_inicio date NOT NULL,
  data_termino date NOT NULL,
  responsavel text NOT NULL,
  status text NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_contratos_updated_at
  BEFORE UPDATE ON public.contratos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para contratos
ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view contratos" ON public.contratos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert contratos" ON public.contratos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update contratos" ON public.contratos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete contratos" ON public.contratos FOR DELETE TO authenticated USING (true);

-- Tabela de medicoes
CREATE TABLE public.medicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contrato_id uuid NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  data date NOT NULL,
  descricao text NOT NULL,
  valor_medido numeric(15,2) NOT NULL DEFAULT 0,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_medicoes_updated_at
  BEFORE UPDATE ON public.medicoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS para medicoes
ALTER TABLE public.medicoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view medicoes" ON public.medicoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert medicoes" ON public.medicoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update medicoes" ON public.medicoes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete medicoes" ON public.medicoes FOR DELETE TO authenticated USING (true);
