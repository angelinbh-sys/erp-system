-- Allow authenticated users to delete from vagas-related tables and notificacoes (for test cleanup)
CREATE POLICY "Authenticated can delete vagas" ON public.vagas FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete vagas_historico" ON public.vagas_historico FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete colaboradores" ON public.colaboradores FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete colaboradores_historico" ON public.colaboradores_historico FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated can delete notificacoes" ON public.notificacoes FOR DELETE TO authenticated USING (true);