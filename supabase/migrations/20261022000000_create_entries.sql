-- 방명록 글 테이블.
-- RLS를 켜고 정책을 만들지 않는다: 브라우저(anon 키)는 이 테이블에 접근할 수 없고,
-- Next.js 서버(service role 키)만 읽고 쓴다. 금칙어·길이 검증이 서버에서만 일어나도록 하기 위함이다.
create table public.entries (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 20),
  message text not null check (char_length(message) between 1 and 300 and message !~ E'[\\r\\n]'),
  created_at timestamptz not null default now()
);

create index entries_created_at_id_idx on public.entries (created_at desc, id desc);

alter table public.entries enable row level security;
