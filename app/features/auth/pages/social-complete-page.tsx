import { redirect } from "react-router";
import type { Route } from "./+types/social-complete-page";

export async function loader({ params, request }: Route.LoaderArgs) {
  const provider = params.provider;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  // TODO: 실제 소셜 로그인 완료 로직 구현
  console.log("Social login complete:", { provider, code, error });

  if (error) {
    // 에러가 있으면 로그인 페이지로 리다이렉트
    return redirect("/auth/login");
  }

  // 성공하면 홈으로 리다이렉트
  return redirect("/home");
}

export default function SocialCompletePage() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">소셜 로그인 완료</h1>
        <p className="text-muted-foreground">
          처리 중...
        </p>
      </div>
    </div>
  );
}
