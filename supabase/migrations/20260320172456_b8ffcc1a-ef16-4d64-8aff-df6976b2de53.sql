
ALTER TABLE public.organograma_nodes ALTER COLUMN nome_colaborador SET DEFAULT '';
ALTER TABLE public.organograma_nodes ADD COLUMN IF NOT EXISTS quantidade integer NOT NULL DEFAULT 1;
ALTER TABLE public.organograma_nodes ADD COLUMN IF NOT EXISTS observacao text;
