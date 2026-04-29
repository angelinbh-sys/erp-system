
-- alteracoes_funcao
CREATE TABLE public.alteracoes_funcao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_colaborador text NOT NULL,
  cargo_atual text NOT NULL,
  novo_cargo text NOT NULL,
  centro_custo text NOT NULL,
  data_alteracao date NOT NULL,
  observacoes text NOT NULL DEFAULT '',
  anexo_nome text,
  anexo_path text,
  criado_por text,
  criado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.alteracoes_funcao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view alteracoes_funcao" ON public.alteracoes_funcao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert alteracoes_funcao" ON public.alteracoes_funcao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update alteracoes_funcao" ON public.alteracoes_funcao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete alteracoes_funcao" ON public.alteracoes_funcao FOR DELETE TO authenticated USING (true);

-- solicitacoes_ferias
CREATE TABLE public.solicitacoes_ferias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_colaborador text NOT NULL,
  centro_custo text NOT NULL,
  data_inicio date NOT NULL,
  data_retorno date NOT NULL,
  qtd_dias integer NOT NULL DEFAULT 0,
  observacoes text NOT NULL DEFAULT '',
  criado_por text,
  criado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.solicitacoes_ferias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view solicitacoes_ferias" ON public.solicitacoes_ferias FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert solicitacoes_ferias" ON public.solicitacoes_ferias FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update solicitacoes_ferias" ON public.solicitacoes_ferias FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete solicitacoes_ferias" ON public.solicitacoes_ferias FOR DELETE TO authenticated USING (true);

-- bucket dp-arquivos
INSERT INTO storage.buckets (id, name, public) VALUES ('dp-arquivos', 'dp-arquivos', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can view dp-arquivos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'dp-arquivos');
CREATE POLICY "Authenticated can upload dp-arquivos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dp-arquivos');
CREATE POLICY "Authenticated can update dp-arquivos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'dp-arquivos');
CREATE POLICY "Authenticated can delete dp-arquivos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'dp-arquivos');
