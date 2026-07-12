-- Predict2U v200.1 — News Comment Regex Hotfix
-- Fixes: "Invalid regular expression: invalid backreference number"
-- Safe to run more than once.

begin;

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

  if p_article_id is null then
    raise exception 'News article not found';
  end if;

  if char_length(clean_body)<2 or char_length(clean_body)>600 then
    raise exception 'Comment must be 2 to 600 characters';
  end if;

  select to_jsonb(a) into article_doc
  from public.p2u_news_articles a
  where a.id=p_article_id
    and a.published=true;

  if article_doc is null then
    raise exception 'News article not found';
  end if;

  if coalesce(nullif(article_doc->>'moderation_status',''),'visible')<>'visible' then
    raise exception 'News article is not open for discussion';
  end if;

  if (
    select count(*)
    from public.p2u_news_comments
    where user_id=auth.uid()
      and created_at>now()-interval '10 minutes'
  )>=10 then
    raise exception 'Comment limit reached. Try again shortly.';
  end if;

  if exists(
    select 1
    from public.p2u_news_comments
    where user_id=auth.uid()
      and article_id=p_article_id
      and lower(body)=lower(clean_body)
      and created_at>now()-interval '1 hour'
  ) then
    raise exception 'Duplicate comment';
  end if;

  -- Keep phrase/link checks separate from the repeated-character check.
  -- The previous combined expression nested the capture group and then used \1,
  -- which caused PostgreSQL to report "invalid backreference number".
  if clean_body ~* 'https?://[^ ]+.*https?://|telegram|whatsapp me|guaranteed win|free money|dm me for|contact me on'
     or clean_body ~ '(.)\1{11,}' then
    raise exception 'Comment looks like spam';
  end if;

  if to_regclass('public.profiles') is not null then
    execute
      'select left(coalesce(nullif(handle,'''') ,''member''),50)
       from public.profiles
       where id=$1'
      into handle_value
      using auth.uid();
  end if;

  insert into public.p2u_news_comments(
    article_id,
    user_id,
    handle_snapshot,
    body,
    status
  )
  values(
    p_article_id,
    auth.uid(),
    coalesce(nullif(handle_value,''),'member'),
    clean_body,
    'visible'
  )
  returning * into row_out;

  return to_jsonb(row_out);
end;
$$;

revoke all on function public.p2u_news_post_comment(bigint,text) from public;
grant execute on function public.p2u_news_post_comment(bigint,text) to authenticated;

commit;
