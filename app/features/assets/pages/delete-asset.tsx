import type { Route } from "./+types/delete-asset";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { assets } from "../schema";

export async function action({ params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  await db.delete(assets).where(eq(assets.asset_id, id));
  return redirect("/assets");
}

export default function DeleteAssetRoute() {
  // 이 라우트는 action(POST) 전용입니다.
  return null;
}

