import { redirect } from "react-router";
import { Route } from "./+types/my-profile-page";

export function loader() {
  // find user using the cookies
  return redirect("/users/nico");
}
