
-- Add must_change_password to profiles (default false so existing users are fine)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS must_change_password boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Add criado_por and soft delete columns to vagas
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS criado_por uuid;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS excluida boolean NOT NULL DEFAULT false;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS motivo_exclusao text;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS excluida_at timestamptz;

-- Create colaboradores table
CREATE TABLE IF NOT EXISTS public.colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id uuid REFERENCES public.vagas(id),
  nome text NOT NULL,
  cargo text NOT NULL,
  centro_custo text NOT NULL,
  site_contrato text NOT NULL,
  data_admissao timestamptz NOT NULL DEFAULT now(),
  data_nascimento date,
  telefone text,
  status text NOT NULL DEFAULT 'Ativo',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view colaboradores" ON public.colaboradores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert colaboradores" ON public.colaboradores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update colaboradores" ON public.colaboradores FOR UPDATE TO authenticated USING (true);

-- Create colaboradores_historico table for edit tracking
CREATE TABLE IF NOT EXISTS public.colaboradores_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id uuid REFERENCES public.colaboradores(id) ON DELETE CASCADE NOT NULL,
  campo_alterado text NOT NULL,
  valor_anterior text,
  valor_novo text,
  motivo text NOT NULL,
  alterado_por text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view historico" ON public.colaboradores_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert historico" ON public.colaboradores_historico FOR INSERT TO authenticated WITH CHECK (true);

-- Trigger for updated_at on colaboradores
CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
