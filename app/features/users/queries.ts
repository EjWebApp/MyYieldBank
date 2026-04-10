import { SupabaseClient } from "@supabase/supabase-js";
import { type Database, isInvalidRefreshSessionError } from "~/supa-client";
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
        email,
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

export const getLoggedInUserId = async (
  client: SupabaseClient<Database>,
  headers: Headers
) => {
  const { data, error } = await client.auth.getUser();
  if (error || data.user === null) {
    if (error && isInvalidRefreshSessionError(error)) {
      await client.auth.signOut();
      throw redirect("/auth/login", { headers });
    }
    throw redirect("/auth/login");
  }
  return data.user.id;
};