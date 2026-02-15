import { runStockNotificationCheck } from "~/lib/notification-worker";
import type { Route } from "./+types/stock-notifications";

/**
 * Cron에서 호출하는 엔드포인트.
 * POST /api/cron/stock-notifications
 * Vercel Cron, GitHub Actions 등에서 5분마다 호출하도록 설정.
 */
export const action = async ({ request }: Route.ActionArgs) => {
  if (typeof window !== "undefined") {
    return Response.json({ ok: false, error: "Server only" }, { status: 403 });
  }

  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  const header = request.headers.get('X-MAMA');
  if (header !== 'X-MAYO') {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    console.log("[Cron] stock-notifications 시작");
    await runStockNotificationCheck();
    console.log("[Cron] stock-notifications 완료");
    return Response.json({ ok: true, message: "Stock notification check completed" });
  } catch (error) {
    console.error("[Cron] stock-notifications 에러:", error);
    if (error instanceof Error) {
      console.error("[Cron] 에러 메시지:", error.message);
      console.error("[Cron] 에러 스택:", error.stack);
    }
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
};


