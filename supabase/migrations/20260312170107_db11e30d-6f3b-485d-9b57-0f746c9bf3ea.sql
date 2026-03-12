
-- Add CPF and Sexo fields to vagas table (Solicitação de Vaga)
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS cpf text;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS sexo text;

-- Add bank data fields to vagas table (Admissão)
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS agencia text;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS digito_agencia text;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS conta text;
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS digito_conta text;
