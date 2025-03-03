create table
  public.directories (
    id integer generated by default as identity not null,
    created_at timestamp with time zone null default now(),
    name text not null,
    dir integer null,
    userid uuid not null default auth.uid (),
    shared boolean not null default false,
    constraint directories_pkey primary key (id),
    constraint directories_dir_fkey foreign key (dir) references directories (id),
    constraint directories_userid_fkey foreign key (userid) references auth.users (id),
    constraint directories_name_check check ((length(name) < 72))
  ) tablespace pg_default;

create table
  public.files (
    id integer generated by default as identity not null,
    created_at timestamp with time zone not null default now(),
    name text not null,
    size bigint not null,
    fileid text not null,
    userid uuid not null default auth.uid (),
    dir integer null,
    chanid text not null default '1025526944776867952'::text,
    constraint files_pkey primary key (id),
    constraint files_dir_fkey foreign key (dir) references directories (id),
    constraint files_userid_fkey foreign key (userid) references auth.users (id),
    constraint files_name_check check ((length(name) < 72))
  ) tablespace pg_default;

create table
  public.previews (
    original integer not null,
    fileid text not null,
    constraint previews_pkey primary key (original),
    constraint previews_original_fkey foreign key (original) references files (id) on delete cascade,
    constraint previews_fileid_check check ((length(fileid) < 21))
  ) tablespace pg_default;

create table
  public.streamers (
    id bigint generated by default as identity,
    link text not null,
    userid uuid not null default auth.uid (),
    constraint streamers_pkey primary key (id),
    constraint streamers_userid_fkey foreign key (userid) references auth.users (id)
  ) tablespace pg_default;

create table
  public.webhooks (
    id integer generated by default as identity,
    created_at timestamp with time zone null default now(),
    "hookNumber" text not null,
    "hookId" text not null,
    userid uuid not null default auth.uid (),
    constraint webhooks_pkey primary key (id),
    constraint webhooks_userid_fkey foreign key (userid) references auth.users (id)
  ) tablespace pg_default;

create table
  public.freehooks (
    hookurl text not null,
    hookid text not null,
    used integer not null default 0,
    constraint freehooks_pkey primary key (hookid)
  ) tablespace pg_default;

create or replace function getFreeHook() 
returns table (
  hookurl text,
  hookid text
) 
SECURITY DEFINER
as $$
  declare 
    s_hookid text;
    s_hookurl text;
    s_used int;
  begin
    -- find the row with the lowest used
    select into s_hookid, s_hookurl, s_used 
      freehooks.hookid, 
      freehooks.hookurl,
      freehooks.used  
    from freehooks
    order by freehooks.used asc
    limit 1;
    -- increase used amount for that row
    update freehooks
    set used = (s_used + 1)
    where freehooks.hookid = s_hookid;
    -- return that row
    return query select s_hookid, s_hookurl;
  end;
$$ language plpgsql;

create or replace function get_items(direc int, search_str text, is_global boolean, from_num int, to_num int, order_column text, order_dir text)
returns table(
  id integer,
  created_at timestamp with time zone,
  name text,
  size bigint,
  fileid text,
  userid uuid,
  dir integer,
  chanid text,
  shared boolean,
  preview text
) 
as $$
  begin
    if order_column = 'id' then
      if order_dir = 'desc' then
        return query (select directories.id, directories.created_at, directories.name, null as size, null as fileid, directories.userid, directories.dir, null as chanid, directories.shared, null as preview
        from directories 
        where (is_global = true or directories.dir = direc or (direc is null and directories.dir is null)) and directories.name like CONCAT('%', search_str, '%') 
        order by directories.id desc)
        union all
        (select files.id, files.created_at, files.name, files.size, files.fileid, files.userid, files.dir, files.chanid, null as shared, previews.fileid as preview
        from files
        left join public.previews
          on public.previews.original = public.files.id
        where (is_global = true or files.dir = direc or (direc is null and files.dir is null)) and files.name like CONCAT('%', search_str, '%')  order by files.id desc)
        offset from_num
        limit (to_num - from_num);
      else
        return query (select directories.id, directories.created_at, directories.name, null as size, null as fileid, directories.userid, directories.dir, null as chanid, directories.shared, null as preview
        from directories 
        where (is_global = true or directories.dir = direc or (direc is null and directories.dir is null)) and directories.name like CONCAT('%', search_str, '%') 
        order by directories.id asc)
        union all
        (select files.id, files.created_at, files.name, files.size, files.fileid, files.userid, files.dir, files.chanid, null as shared, previews.fileid as preview
        from files
        left join public.previews
          on public.previews.original = public.files.id
        where (is_global = true or files.dir = direc or (direc is null and files.dir is null)) and files.name like CONCAT('%', search_str, '%')  order by files.id asc)
        offset from_num
        limit (to_num - from_num);
      end if;
    elsif order_column = 'size' then
      if order_dir = 'desc' then
        return query (select directories.id, directories.created_at, directories.name, null as size, null as fileid, directories.userid, directories.dir, null as chanid, directories.shared, null as preview
        from directories 
        where (is_global = true or directories.dir = direc or (direc is null and directories.dir is null)) and directories.name like CONCAT('%', search_str, '%') 
        order by directories.name desc)
        union all
        (select files.id, files.created_at, files.name, files.size, files.fileid, files.userid, files.dir, files.chanid, null as shared, previews.fileid as preview
        from files
        left join public.previews
          on public.previews.original = public.files.id
        where (is_global = true or files.dir = direc or (direc is null and files.dir is null)) and files.name like CONCAT('%', search_str, '%')  order by files.size desc)
        offset from_num
        limit (to_num - from_num);
      else
        return query (select directories.id, directories.created_at, directories.name, null as size, null as fileid, directories.userid, directories.dir, null as chanid, directories.shared, null as preview
        from directories 
        where (is_global = true or directories.dir = direc or (direc is null and directories.dir is null)) and directories.name like CONCAT('%', search_str, '%') 
        order by directories.name asc)
        union all
        (select files.id, files.created_at, files.name, files.size, files.fileid, files.userid, files.dir, files.chanid, null as shared, previews.fileid as preview
        from files 
        left join public.previews
          on public.previews.original = public.files.id
        where (is_global = true or files.dir = direc or (direc is null and files.dir is null)) and files.name like CONCAT('%', search_str, '%')  order by files.size asc)
        offset from_num
        limit (to_num - from_num);
      end if;
    else
      if order_dir = 'desc' then
        return query (select directories.id, directories.created_at, directories.name, null as size, null as fileid, directories.userid, directories.dir, null as chanid, directories.shared, null as preview
        from directories 
        where (is_global = true or directories.dir = direc or (direc is null and directories.dir is null)) and directories.name like CONCAT('%', search_str, '%') 
        order by directories.name desc)
        union all
        (select files.id, files.created_at, files.name, files.size, files.fileid, files.userid, files.dir, files.chanid, null as shared, previews.fileid as preview
        from files
        left join public.previews
          on public.previews.original = public.files.id
        where (is_global = true or files.dir = direc or (direc is null and files.dir is null)) and files.name like CONCAT('%', search_str, '%')  order by files.name desc)
        offset from_num
        limit (to_num - from_num);
      else
        return query (select directories.id, directories.created_at, directories.name, null as size, null as fileid, directories.userid, directories.dir, null as chanid, directories.shared, null as preview
        from directories 
        where (is_global = true or directories.dir = direc or (direc is null and directories.dir is null)) and directories.name like CONCAT('%', search_str, '%') 
        order by directories.name asc)
        union all
        (select files.id, files.created_at, files.name, files.size, files.fileid, files.userid, files.dir, files.chanid, null as shared, previews.fileid as preview
        from files
        left join public.previews
          on public.previews.original = public.files.id
        where (is_global = true or files.dir = direc or (direc is null and files.dir is null)) and files.name like CONCAT('%', search_str, '%')  order by files.name asc)
        offset from_num
        limit (to_num - from_num);
      end if;
    end if;
  end;
$$ language plpgsql;

-- for files
alter table files ENABLE ROW LEVEL SECURITY;

create policy files_control 
    ON files
    FOR ALL
    TO authenticated 
    USING (auth.uid() = userid);

-- for directories
alter table directories ENABLE ROW LEVEL SECURITY;

create policy directories_control 
    ON directories
    FOR ALL
    TO authenticated 
    USING (auth.uid() = userid);

-- for previews
alter table previews ENABLE ROW LEVEL SECURITY;

create policy previews_control
    ON previews
    FOR ALL
    TO authenticated
    USING ((
        SELECT files.userid
        FROM files
        WHERE (previews.original = files.id)
        LIMIT 1) = auth.uid());

-- for streamers
alter table streamers ENABLE ROW LEVEL SECURITY;

create policy streamers_control 
    ON streamers
    FOR ALL
    TO authenticated 
    USING (auth.uid() = userid);

-- for freehooks
alter table freehooks ENABLE ROW LEVEL SECURITY;

-- for webhooks
alter table webhooks ENABLE ROW LEVEL SECURITY;

create policy webhooks_control 
    ON webhooks
    FOR ALL
    TO authenticated 
    USING (auth.uid() = userid);