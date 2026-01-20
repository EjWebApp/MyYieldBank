import type { Route } from "./+types/toggle-hidden-asset";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { assets } from "../schema";

export async function action({ params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  const [asset] = await db
    .select({ hidden: assets.hidden })
    .from(assets)
    .where(eq(assets.asset_id, id))
    .limit(1);

  if (!asset) {
    throw new Response("Not found", { status: 404 });
  }

  await db
    .update(assets)
    .set({ hidden: !asset.hidden })
    .where(eq(assets.asset_id, id));

  return redirect("/assets");
}

export default function ToggleHiddenAssetRoute() {
  // 이 라우트는 action(POST) 전용입니다.
  return null;
}

