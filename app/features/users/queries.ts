import{SupabaseClient} from "@supabase/supabase-js";
import type { Database } from "~/supa-client";
import { redirect } from "react-router";

export const getUserProfile = async (
    client: SupabaseClient<Database>,
    {username}: {username: string}
) => {
  const { data, error } = await client
    .from("profiles")
    .select(
      `
        profile_id,
        name,
        username,
        avatar,
        headline,
        bio
        `
    )
    .eq("username", username)
    .single();
  if (error) {
    throw error;
  }
  return data;
};

export const getLoggedInUserId = async (client: SupabaseClient<Database>) => {
  const { data, error } = await client.auth.getUser();
  if (error || data.user === null) {
    throw redirect("/auth/login");
  }
  return data.user.id;
};