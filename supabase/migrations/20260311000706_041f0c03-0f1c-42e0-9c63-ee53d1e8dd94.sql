
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  modulo text NOT NULL,
  pagina text NOT NULL,
  acao text NOT NULL,
  registro_id text,
  registro_ref text,
  descricao text NOT NULL,
  motivo text,
  dados_extras jsonb
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view audit_logs" ON public.audit_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert audit_logs" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_modulo ON public.audit_logs (modulo);
CREATE INDEX idx_audit_logs_user_name ON public.audit_logs (user_name);
