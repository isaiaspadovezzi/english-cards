-- Execute este script no SQL Editor do Supabase, uma vez.
-- As quatro tabelas precisam existir antes de executar.
-- Atenção: políticas antigas com os mesmos nomes devem ser removidas antes de executar novamente.

alter table public.vocabulary_cards enable row level security;

create policy "Read own and shared vocabulary cards"
on public.vocabulary_cards for select to authenticated
using (
  owner_id = (select auth.uid())
  or exists (
    select 1 from public.card_shares s
    where s.card_id = id and s.shared_with = (select auth.uid())
  )
);

create policy "Insert own vocabulary cards"
on public.vocabulary_cards for insert to authenticated
with check (owner_id = (select auth.uid()));

create policy "Update own vocabulary cards"
on public.vocabulary_cards for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Delete own vocabulary cards"
on public.vocabulary_cards for delete to authenticated
using (owner_id = (select auth.uid()));

grant select, insert, update, delete on public.vocabulary_cards to authenticated;

-- As políticas de card_shares, card_favorites e card_reviews foram criadas
-- nas etapas anteriores. Revise-as no Supabase antes de usar dados reais.
