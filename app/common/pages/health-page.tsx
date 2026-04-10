import type { Route } from "./+types/health-page";

export async function loader(_args: Route.LoaderArgs) {
  return new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
