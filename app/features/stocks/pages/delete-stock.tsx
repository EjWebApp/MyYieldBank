import type { Route } from "./+types/delete-stock";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { stockHoldings } from "../schema";

export async function action({ params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  await db.delete(stockHoldings).where(eq(stockHoldings.holding_id, id));
  return redirect("/stocks");
}

export default function DeleteStockRoute() {
  // 이 라우트는 action(POST) 전용입니다.
  return null;
}
