
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS super_admin boolean NOT NULL DEFAULT false;

UPDATE public.profiles SET super_admin = true WHERE email = 'felipe.souza@geotechbrasil.com.br';
