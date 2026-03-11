
-- Add numero_vaga column with auto-increment sequence
CREATE SEQUENCE IF NOT EXISTS public.vagas_numero_seq START WITH 1 INCREMENT BY 1;

ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS numero_vaga text;

-- Generate numero_vaga for existing vagas
UPDATE public.vagas SET numero_vaga = 'VAGA-' || LPAD(nextval('public.vagas_numero_seq')::text, 4, '0') WHERE numero_vaga IS NULL;

-- Create function to auto-generate numero_vaga on insert
CREATE OR REPLACE FUNCTION public.generate_numero_vaga()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.numero_vaga IS NULL OR NEW.numero_vaga = '' THEN
    NEW.numero_vaga := 'VAGA-' || LPAD(nextval('public.vagas_numero_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_generate_numero_vaga
BEFORE INSERT ON public.vagas
FOR EACH ROW
EXECUTE FUNCTION public.generate_numero_vaga();

-- Add atualizado_por column
ALTER TABLE public.vagas ADD COLUMN IF NOT EXISTS atualizado_por text;

-- Add status_processo value for cancelled vagas
-- (no enum needed, it's a text field)
