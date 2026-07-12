-- Predict2U v201 — News comment likes, owner editing, owner deletion and like alerts.
-- Safe to run more than once. Run after the v200.1 comment regex hotfix.

begin;

-- Keep older News installations compatible while adding social comment fields.
alter table if exists public.p2u_news_comments
  add column if not exists like_count integer not null default 0,
  add column if not exists edited_at timestamptz null,
  add column if not exists deleted_at timestamptz null;

-- The original inline check did not include the new soft-deleted state.
alter table if exists public.p2u_news_comments
  drop constraint if exists p2u_news_comments_status_check;
alter table if exists public.p2u_news_comments
  add constraint p2u_news_comments_status_check
  check (status in ('visible','hidden','review','deleted'));

alter table if exists public.p2u_news_comments
  drop constraint if exists p2u_news_comments_like_count_check;
alter table if exists public.p2u_news_comments
  add constraint p2u_news_comments_like_count_check
  check (like_count >= 0);

create table if not exists public.p2u_news_comment_likes (
  comment_id bigint not null references public.p2u_news_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(comment_id,user_id)
);

create index if not exists p2u_news_comment_likes_user_idx
  on public.p2u_news_comment_likes(user_id,created_at desc);
create index if not exists p2u_news_comment_likes_comment_idx
  on public.p2u_news_comment_likes(comment_id,created_at desc);

alter table public.p2u_news_comment_likes enable row level security;
drop policy if exists "Users read own news comment likes" on public.p2u_news_comment_likes;
create policy "Users read own news comment likes" on public.p2u_news_comment_likes
for select to authenticated using(user_id=auth.uid());

-- Likes are changed through a guarded RPC so users cannot impersonate another account.
drop policy if exists "Users insert own news comment likes" on public.p2u_news_comment_likes;
drop policy if exists "Users delete own news comment likes" on public.p2u_news_comment_likes;

-- Soft deletion is used so moderation and audit records do not break.
drop policy if exists "Users delete own news comments" on public.p2u_news_comments;

create or replace function public.p2u_news_update_comment_like_count()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare affected_id bigint;
begin
  affected_id:=case when tg_op='DELETE' then old.comment_id else new.comment_id end;
  update public.p2u_news_comments
  set like_count=(select count(*) from public.p2u_news_comment_likes where comment_id=affected_id),
      updated_at=now()
  where id=affected_id;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists p2u_news_comment_like_count_trigger on public.p2u_news_comment_likes;
create trigger p2u_news_comment_like_count_trigger
after insert or delete on public.p2u_news_comment_likes
for each row execute function public.p2u_news_update_comment_like_count();

-- Corrected, schema-tolerant posting function retained from v200.1.
create or replace function public.p2u_news_post_comment(
  p_article_id bigint,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  clean_body text:=trim(regexp_replace(coalesce(p_body,''),'\s+',' ','g'));
  handle_value text:='member';
  article_doc jsonb;
  row_out public.p2u_news_comments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;
  if p_article_id is null then raise exception 'News article not found'; end if;
  if char_length(clean_body)<2 or char_length(clean_body)>600 then
    raise exception 'Comment must be 2 to 600 characters';
  end if;

  select to_jsonb(a) into article_doc
  from public.p2u_news_articles a
  where a.id=p_article_id and a.published=true;

  if article_doc is null then raise exception 'News article not found'; end if;
  if coalesce(nullif(article_doc->>'moderation_status',''),'visible')<>'visible' then
    raise exception 'News article is not open for discussion';
  end if;

  if (select count(*) from public.p2u_news_comments
      where user_id=auth.uid() and created_at>now()-interval '10 minutes')>=10 then
    raise exception 'Comment limit reached. Try again shortly.';
  end if;

  if exists(
    select 1 from public.p2u_news_comments
    where user_id=auth.uid() and article_id=p_article_id
      and lower(body)=lower(clean_body)
      and created_at>now()-interval '1 hour'
      and coalesce(status,'visible')<>'deleted'
  ) then
    raise exception 'Duplicate comment';
  end if;

  if clean_body ~* 'https?://[^ ]+.*https?://|telegram|whatsapp me|guaranteed win|free money|dm me for|contact me on'
     or clean_body ~ '(.)\1{11,}' then
    raise exception 'Comment looks like spam';
  end if;

  if to_regclass('public.profiles') is not null then
    execute
      'select left(coalesce(nullif(handle,'''') ,''member''),50)
       from public.profiles where id=$1'
      into handle_value using auth.uid();
  end if;

  insert into public.p2u_news_comments(article_id,user_id,handle_snapshot,body,status)
  values(p_article_id,auth.uid(),coalesce(nullif(handle_value,''),'member'),clean_body,'visible')
  returning * into row_out;

  return to_jsonb(row_out);
end;
$$;

create or replace function public.p2u_news_edit_comment(
  p_comment_id bigint,
  p_body text
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  clean_body text:=trim(regexp_replace(coalesce(p_body,''),'\s+',' ','g'));
  row_out public.p2u_news_comments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;
  if char_length(clean_body)<2 or char_length(clean_body)>600 then
    raise exception 'Comment must be 2 to 600 characters';
  end if;
  if clean_body ~* 'https?://[^ ]+.*https?://|telegram|whatsapp me|guaranteed win|free money|dm me for|contact me on'
     or clean_body ~ '(.)\1{11,}' then
    raise exception 'Comment looks like spam';
  end if;

  update public.p2u_news_comments
  set body=clean_body,edited_at=now(),updated_at=now()
  where id=p_comment_id
    and user_id=auth.uid()
    and status='visible'
  returning * into row_out;

  if row_out.id is null then
    raise exception 'Comment not found or cannot be edited' using errcode='42501';
  end if;
  return to_jsonb(row_out);
end;
$$;

create or replace function public.p2u_news_delete_comment(
  p_comment_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  row_out public.p2u_news_comments%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;

  select * into row_out
  from public.p2u_news_comments
  where id=p_comment_id and user_id=auth.uid() and status='visible'
  for update;

  if row_out.id is null then
    raise exception 'Comment not found or cannot be deleted' using errcode='42501';
  end if;

  delete from public.p2u_news_comment_likes where comment_id=p_comment_id;
  update public.p2u_news_comments
  set body='',status='deleted',deleted_at=now(),updated_at=now(),like_count=0
  where id=p_comment_id
  returning * into row_out;

  return jsonb_build_object(
    'ok',true,
    'comment_id',row_out.id,
    'article_id',row_out.article_id,
    'deleted',true
  );
end;
$$;

create or replace function public.p2u_news_toggle_comment_like(
  p_comment_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path=public,auth
as $$
declare
  comment_row public.p2u_news_comments%rowtype;
  liked_now boolean:=false;
  count_now integer:=0;
begin
  if auth.uid() is null then
    raise exception 'Sign in required' using errcode='42501';
  end if;

  select * into comment_row
  from public.p2u_news_comments
  where id=p_comment_id and status='visible'
  for update;

  if comment_row.id is null then raise exception 'Comment not found'; end if;
  if comment_row.user_id=auth.uid() then raise exception 'You cannot like your own comment'; end if;

  if exists(select 1 from public.p2u_news_comment_likes where comment_id=p_comment_id and user_id=auth.uid()) then
    delete from public.p2u_news_comment_likes where comment_id=p_comment_id and user_id=auth.uid();
    liked_now:=false;
  else
    insert into public.p2u_news_comment_likes(comment_id,user_id)
    values(p_comment_id,auth.uid())
    on conflict do nothing;
    liked_now:=true;
  end if;

  select like_count into count_now from public.p2u_news_comments where id=p_comment_id;
  return jsonb_build_object(
    'comment_id',p_comment_id,
    'liked',liked_now,
    'like_count',coalesce(count_now,0)
  );
end;
$$;

-- Queue a targeted push notification when another member likes a comment.
-- It uses the existing v183 push dispatcher and does not expose the liker identity publicly.
create or replace function public.p2u_news_notify_comment_like()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  comment_owner uuid;
  article_key bigint;
  liker_handle text:='A member';
  excerpt text:='';
begin
  select user_id,article_id,left(body,90)
  into comment_owner,article_key,excerpt
  from public.p2u_news_comments
  where id=new.comment_id and status='visible';

  if comment_owner is null or comment_owner=new.user_id then return new; end if;

  if to_regclass('public.profiles') is not null then
    execute
      'select coalesce(nullif(''@''||handle,''@''),''A member'') from public.profiles where id=$1'
      into liker_handle using new.user_id;
  end if;

  if to_regclass('public.p2u_push_jobs') is not null then
    if exists(
      select 1 from public.p2u_push_jobs
      where requested_by=new.user_id
        and created_at>now()-interval '10 minutes'
        and payload->>'event'='news_comment_like'
        and payload->>'comment_id'=new.comment_id::text
    ) then
      return new;
    end if;
    insert into public.p2u_push_jobs(
      category,title,body,url,audience,payload,requested_by,scheduled_for
    ) values (
      'system',
      'Your comment received a like',
      left(coalesce(liker_handle,'A member')||' liked your News comment: '||coalesce(excerpt,''),240),
      'news.html?article='||article_key::text||'&comment='||new.comment_id::text,
      jsonb_build_object('type','users','user_ids',jsonb_build_array(comment_owner::text)),
      jsonb_build_object(
        'event','news_comment_like',
        'article_id',article_key,
        'comment_id',new.comment_id,
        'reason','Someone liked your comment'
      ),
      new.user_id,
      now()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists p2u_news_comment_like_notification_trigger on public.p2u_news_comment_likes;
create trigger p2u_news_comment_like_notification_trigger
after insert on public.p2u_news_comment_likes
for each row execute function public.p2u_news_notify_comment_like();

-- Keep story comment totals accurate after soft deletion and moderation changes.
create or replace function public.p2u_news_update_comment_count()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare affected_id bigint;
begin
  affected_id:=case when tg_op='DELETE' then old.article_id else new.article_id end;
  update public.p2u_news_articles
  set comment_count=(
    select count(*) from public.p2u_news_comments
    where article_id=affected_id and coalesce(status,'visible')='visible'
  ),updated_at=now()
  where id=affected_id;
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists p2u_news_comment_count_trigger on public.p2u_news_comments;
create trigger p2u_news_comment_count_trigger
after insert or update or delete on public.p2u_news_comments
for each row execute function public.p2u_news_update_comment_count();

revoke all on function public.p2u_news_post_comment(bigint,text) from public;
revoke all on function public.p2u_news_edit_comment(bigint,text) from public;
revoke all on function public.p2u_news_delete_comment(bigint) from public;
revoke all on function public.p2u_news_toggle_comment_like(bigint) from public;
grant execute on function public.p2u_news_post_comment(bigint,text) to authenticated;
grant execute on function public.p2u_news_edit_comment(bigint,text) to authenticated;
grant execute on function public.p2u_news_delete_comment(bigint) to authenticated;
grant execute on function public.p2u_news_toggle_comment_like(bigint) to authenticated;
grant select on public.p2u_news_comment_likes to authenticated;

-- Backfill counters in case likes already exist from a partial installation.
update public.p2u_news_comments c
set like_count=(select count(*) from public.p2u_news_comment_likes l where l.comment_id=c.id)
where c.like_count is distinct from (select count(*) from public.p2u_news_comment_likes l where l.comment_id=c.id);

commit;
