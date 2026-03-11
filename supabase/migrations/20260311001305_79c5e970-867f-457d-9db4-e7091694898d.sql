
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS status_processo text NOT NULL DEFAULT 'Aguardando Diretoria';
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS responsavel_etapa text NOT NULL DEFAULT 'Diretoria';

-- Update existing records based on current status
UPDATE public.vagas SET status_processo = 'Aguardando Diretoria', responsavel_etapa = 'Diretoria' WHERE status = 'Aguardando Aprovação';
UPDATE public.vagas SET status_processo = 'Reprovado pela Diretoria', responsavel_etapa = 'RH' WHERE status = 'Reprovada';
UPDATE public.vagas SET status_processo = 'Devolvido para RH', responsavel_etapa = 'RH' WHERE status = 'Devolvida SESMT';
UPDATE public.vagas SET status_processo = CASE WHEN enviado_admissao THEN 'Aguardando Admissão' ELSE 'Em andamento no SESMT' END, responsavel_etapa = CASE WHEN enviado_admissao THEN 'Dep. Pessoal' ELSE 'SESMT' END WHERE status = 'Aprovada';
