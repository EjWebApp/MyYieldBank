create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    -- raw_user_meta_data는 signUp의 options.data에 저장됨
    if new.raw_user_meta_data is not null then
        if new.raw_user_meta_data ? 'name' and new.raw_user_meta_data ? 'username' then
            insert into public.profiles (profile_id, name, username)
            values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'username');
        else
            -- name이나 username이 없으면 기본값 사용
            insert into public.profiles (profile_id, name, username)
            values (
                new.id, 
                COALESCE(new.raw_user_meta_data ->> 'name', 'Anonymous'),
                COALESCE(new.raw_user_meta_data ->> 'username', 'user_' || substr(md5(random()::text), 1, 8))
            );
        end if;
    else
        -- raw_user_meta_data가 없으면 기본값으로 프로필 생성
        insert into public.profiles (profile_id, name, username)
        values (new.id, 'Anonymous', 'user_' || substr(md5(random()::text), 1, 8));
    end if;
    return new;
end;
$$;

create trigger user_to_profile_trigger
after insert on auth.users
for each row execute function public.handle_new_user();