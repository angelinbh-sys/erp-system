create table public.centros_custo (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  codigo text not null,
  sites jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cargos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.centros_custo enable row level security;
alter table public.cargos enable row level security;

create policy "Authenticated can view centros_custo" on public.centros_custo for select to authenticated using (true);
create policy "Authenticated can insert centros_custo" on public.centros_custo for insert to authenticated with check (true);
create policy "Authenticated can update centros_custo" on public.centros_custo for update to authenticated using (true);
create policy "Authenticated can delete centros_custo" on public.centros_custo for delete to authenticated using (true);

create policy "Authenticated can view cargos" on public.cargos for select to authenticated using (true);
create policy "Authenticated can insert cargos" on public.cargos for insert to authenticated with check (true);
create policy "Authenticated can update cargos" on public.cargos for update to authenticated using (true);
create policy "Authenticated can delete cargos" on public.cargos for delete to authenticated using (true);

create trigger update_centros_custo_updated_at before update on public.centros_custo for each row execute function public.update_updated_at_column();
create trigger update_cargos_updated_at before update on public.cargos for each row execute function public.update_updated_at_column();