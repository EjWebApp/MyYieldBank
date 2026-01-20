import { redirect } from "react-router";
import type { Route } from "./+types/index-page";

export async function loader({}: Route.LoaderArgs) {
  return redirect("/home");
}

export default function IndexPage() {
  return null;
}

