import{SupabaseClient} from "@supabase/supabase-js";
import type { Database } from "~/supa-client";


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

/*export const getUserProducts = async (username: string) => {
  const { data, error } = await client
    .from("products")
    .select(
      `
        ${productListSelect},
        profiles!products_to_profiles!inner (
            profile_id
        )
    `
    )
    .eq("profiles.username", username);
  if (error) {
    throw error;
  }
  return data;
};*/

/*export const getUserPosts = async (username: string) => {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("username", username);
  if (error) {
    throw error;
  }
  return data;
};
*/