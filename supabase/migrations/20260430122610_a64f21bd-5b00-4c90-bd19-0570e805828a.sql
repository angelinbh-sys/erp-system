-- Helper: SECURITY DEFINER function to check super_admin without recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = _user_id AND super_admin = true
  )
$$;

-- =========================================
-- 1. VAGAS — remove public, add authenticated
-- =========================================
DROP POLICY IF EXISTS "Todos podem ver vagas" ON public.vagas;
DROP POLICY IF EXISTS "Todos podem criar vagas" ON public.vagas;
DROP POLICY IF EXISTS "Todos podem atualizar vagas" ON public.vagas;

CREATE POLICY "Authenticated can view vagas" ON public.vagas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert vagas" ON public.vagas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update vagas" ON public.vagas
  FOR UPDATE TO authenticated USING (true);

-- =========================================
-- 1b. NOTIFICACOES — remove public, add authenticated
-- =========================================
DROP POLICY IF EXISTS "Todos podem ver notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Todos podem criar notificacoes" ON public.notificacoes;
DROP POLICY IF EXISTS "Todos podem atualizar notificacoes" ON public.notificacoes;

CREATE POLICY "Authenticated can view notificacoes" ON public.notificacoes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert notificacoes" ON public.notificacoes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update notificacoes" ON public.notificacoes
  FOR UPDATE TO authenticated USING (true);

-- =========================================
-- 2. PROFILES — DELETE policy (own or super_admin)
-- =========================================
DROP POLICY IF EXISTS "Authenticated can delete profiles" ON public.profiles;
CREATE POLICY "Authenticated can delete profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_super_admin(auth.uid())
  );

-- =========================================
-- 4. PROFILES — restrict UPDATE to own profile or super_admin
-- =========================================
DROP POLICY IF EXISTS "Authenticated can update profiles" ON public.profiles;
CREATE POLICY "User can update own profile or super_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = user_id
    OR public.is_super_admin(auth.uid())
  );

-- =========================================
-- 3. GRUPOS_PERMISSAO — only super_admin can write
-- =========================================
DROP POLICY IF EXISTS "Authenticated can insert grupos_permissao" ON public.grupos_permissao;
DROP POLICY IF EXISTS "Authenticated can update grupos_permissao" ON public.grupos_permissao;
DROP POLICY IF EXISTS "Authenticated can delete grupos_permissao" ON public.grupos_permissao;

CREATE POLICY "Only super_admin can insert grupos_permissao" ON public.grupos_permissao
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Only super_admin can update grupos_permissao" ON public.grupos_permissao
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Only super_admin can delete grupos_permissao" ON public.grupos_permissao
  FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

-- =========================================
-- 5. AUDIT_LOGS — explicitly ensure no UPDATE/DELETE policy exists
-- =========================================
DROP POLICY IF EXISTS "Authenticated can update audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated can delete audit_logs" ON public.audit_logs;
-- No new policy created — absence of policy means action is denied under RLS.