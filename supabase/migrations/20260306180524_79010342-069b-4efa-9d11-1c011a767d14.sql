
-- Tabela de vagas
CREATE TABLE public.vagas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo TEXT NOT NULL,
  salario TEXT NOT NULL,
  centro_custo_nome TEXT NOT NULL,
  centro_custo_codigo TEXT,
  site_contrato TEXT NOT NULL,
  local_trabalho TEXT NOT NULL,
  nome_candidato TEXT NOT NULL,
  data_nascimento TEXT NOT NULL,
  telefone TEXT NOT NULL,
  beneficios JSONB DEFAULT '{}'::jsonb,
  curriculo_nome TEXT,
  documento_nome TEXT,
  status TEXT NOT NULL DEFAULT 'Aguardando Aprovação',
  observacao_reprovacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de notificações
CREATE TABLE public.notificacoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'info',
  link TEXT,
  lida BOOLEAN NOT NULL DEFAULT false,
  vaga_id UUID REFERENCES public.vagas(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies para vagas (acesso público por enquanto, sem auth)
CREATE POLICY "Todos podem ver vagas" ON public.vagas FOR SELECT USING (true);
CREATE POLICY "Todos podem criar vagas" ON public.vagas FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar vagas" ON public.vagas FOR UPDATE USING (true);

-- Policies para notificações
CREATE POLICY "Todos podem ver notificacoes" ON public.notificacoes FOR SELECT USING (true);
CREATE POLICY "Todos podem criar notificacoes" ON public.notificacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Todos podem atualizar notificacoes" ON public.notificacoes FOR UPDATE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vagas_updated_at
  BEFORE UPDATE ON public.vagas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
