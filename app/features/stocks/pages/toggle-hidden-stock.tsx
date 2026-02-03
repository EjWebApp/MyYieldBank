import type { Route } from "./+types/toggle-hidden-stock";
import { redirect } from "react-router";
import { eq } from "drizzle-orm";
import { db } from "~/db";
import { stockHoldings } from "../schema";

export async function action({ params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) {
    throw new Response("Invalid id", { status: 400 });
  }

  const [stock] = await db
    .select({ hidden: stockHoldings.hidden })
    .from(stockHoldings)
    .where(eq(stockHoldings.holding_id, id))
    .limit(1);

  if (!stock) {
    throw new Response("Not found", { status: 404 });
  }

  await db
    .update(stockHoldings)
    .set({ hidden: !stock.hidden })
    .where(eq(stockHoldings.holding_id, id));

  return redirect("/stocks");
}

export default function ToggleHiddenStockRoute() {
  // 이 라우트는 action(POST) 전용입니다.
  return null;
}
