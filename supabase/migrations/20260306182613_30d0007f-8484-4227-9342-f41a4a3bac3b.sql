
-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome text NOT NULL,
  email text NOT NULL,
  cpf text,
  grupo_permissao text NOT NULL DEFAULT '',
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view profiles
CREATE POLICY "Authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- All authenticated users can insert profiles (admin creates users)
CREATE POLICY "Authenticated can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- All authenticated users can update profiles
CREATE POLICY "Authenticated can update profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (true);

-- Add candidate status to vagas
ALTER TABLE public.vagas ADD COLUMN status_candidato text NOT NULL DEFAULT 'Em análise';
ALTER TABLE public.vagas ADD COLUMN status_candidato_updated_at timestamptz;
