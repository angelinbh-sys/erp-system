
CREATE TABLE public.organograma_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contrato_id UUID NOT NULL REFERENCES public.contratos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES public.colaboradores(id) ON DELETE SET NULL,
  cargo TEXT NOT NULL,
  nome_colaborador TEXT NOT NULL,
  superior_id UUID REFERENCES public.organograma_nodes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.organograma_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view organograma_nodes" ON public.organograma_nodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert organograma_nodes" ON public.organograma_nodes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update organograma_nodes" ON public.organograma_nodes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete organograma_nodes" ON public.organograma_nodes FOR DELETE TO authenticated USING (true);
