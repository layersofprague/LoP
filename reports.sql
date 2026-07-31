-- ══════════════════════════════════════════════════════════
-- Tabulka pro hlášení nesrovnalostí (report-modal.js)
-- Spustit v Supabase → SQL Editor.
-- ══════════════════════════════════════════════════════════

create table if not exists public.reports (
  id          bigserial primary key,
  created_at  timestamptz not null default now(),
  email       text not null,
  kind        text not null check (kind in ('facts','copyright','translation','other')),
  message     text not null,
  place_id    text,
  page_title  text,
  page_url    text,
  lang        text,
  resolved    boolean not null default false,
  note        text                       -- interní poznámka při vyřizování
);

comment on table public.reports is
  'Hlášení nesrovnalostí z detail stránek. Zapisuje anon klient, čte jen admin.';

create index if not exists reports_created_idx  on public.reports (created_at desc);
create index if not exists reports_resolved_idx on public.reports (resolved) where resolved = false;

-- ── Ochrana proti zneužití na úrovni databáze ──
-- Publishable klíč je v JS veřejný, takže limity nesmí být jen na frontendu.
alter table public.reports
  add constraint reports_message_len check (char_length(message) between 10 and 4000),
  add constraint reports_email_len   check (char_length(email) <= 254),
  add constraint reports_email_fmt   check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- ── RLS ──
alter table public.reports enable row level security;

-- Kdokoli smí VLOŽIT hlášení…
drop policy if exists reports_insert_anon on public.reports;
create policy reports_insert_anon
  on public.reports for insert
  to anon, authenticated
  with check (true);

-- …ale NIKDO je přes API nesmí číst, měnit ani mazat.
-- (Žádná SELECT policy = žádné čtení. Prohlížej přes Table Editor
--  nebo service_role klíčem na serveru.)

-- ══════════════════════════════════════════════════════════
-- Volitelně později: notifikace na e-mail
-- Database → Webhooks → nový webhook na INSERT do `reports`
-- → Edge Function, která odešle mail přes Resend/Mailgun.
-- Klíč zůstane na serveru, frontend se nemění.
-- ══════════════════════════════════════════════════════════
