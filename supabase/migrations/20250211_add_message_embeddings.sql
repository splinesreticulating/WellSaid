create extension if not exists vector;

create table if not exists message_embeddings (
  message_id text primary key,
  thread_id text not null,
  ts timestamptz not null,
  sender text not null,
  text text not null,
  embedding vector(1536)
);

create index if not exists message_embeddings_embedding_idx on message_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 50);

create or replace function match_message_embeddings(
  query_embedding vector(1536),
  thread_filter text,
  match_count integer default 5
)
returns table (
  message_id text,
  thread_id text,
  ts timestamptz,
  sender text,
  text text,
  similarity double precision
)
language sql
stable
as $$
  select
    message_id,
    thread_id,
    ts,
    sender,
    text,
    1 - (embedding <=> query_embedding) as similarity
  from message_embeddings
  where thread_id = thread_filter
  order by embedding <=> query_embedding
  limit match_count;
$$;
