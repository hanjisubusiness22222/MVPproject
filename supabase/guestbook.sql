-- 2026 플래닛 독서학교 한 줄 방명록 테이블 및 보안 설정
create table if not exists public.guestbook (
  id bigint generated always as identity primary key,
  name text not null,
  content text not null,
  created_at timestamptz not null default now(),
  constraint guestbook_name_length_chk check (char_length(btrim(name)) between 1 and 20),
  constraint guestbook_content_length_chk check (char_length(btrim(content)) between 1 and 200)
);

-- 최신 20건 조회용 인덱스
create index if not exists idx_guestbook_created_at_desc
  on public.guestbook (created_at desc, id desc);

-- RLS 활성화 (누구나 읽기만 가능)
alter table public.guestbook enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'guestbook'
      and policyname = 'guestbook_select_public'
  ) then
    create policy "guestbook_select_public"
      on public.guestbook
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- 공개 역할(anon, authenticated)에는 SELECT 권한만 부여
revoke all on table public.guestbook from public, anon, authenticated;
grant select on table public.guestbook to anon, authenticated;
grant all on table public.guestbook to service_role;
