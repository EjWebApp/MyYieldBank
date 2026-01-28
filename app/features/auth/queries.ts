import { makeSSRClient } from "~/supa-client";

export const checkUsernameExists = async (
  request: Request,
  { username }: { username: string }
) => {
  const { client } = makeSSRClient(request);
  const { data, error } = await client
    .from("profiles")
    .select("profile_id")
    .eq("username", username)
    .maybeSingle();
  
  if (error) {
    console.error(error);
    return false;
  }
  
  // data가 null이면 사용자명이 존재하지 않음 (사용 가능)
  // data가 있으면 사용자명이 존재함 (사용 불가)
  return data !== null;
};