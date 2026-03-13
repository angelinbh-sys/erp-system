
ALTER TABLE public.medicoes ADD COLUMN data_inicio date NOT NULL DEFAULT now();
ALTER TABLE public.medicoes ADD COLUMN data_fim date NOT NULL DEFAULT now();
UPDATE public.medicoes SET data_inicio = data, data_fim = data;
ALTER TABLE public.medicoes DROP COLUMN data;
