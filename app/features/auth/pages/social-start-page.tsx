import { redirect } from "react-router";
import type { Route } from "./+types/social-start-page";

export async function loader({ params }: Route.LoaderArgs) {
  const provider = params.provider;

  // TODO: 실제 소셜 로그인 시작 로직 구현
  console.log("Social login start:", { provider });

  // 임시로 소셜 로그인 완료 페이지로 리다이렉트
  return redirect(`/auth/social/${provider}/complete`);
}

export default function SocialStartPage() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">소셜 로그인</h1>
        <p className="text-muted-foreground">
          로그인 중...
        </p>
      </div>
    </div>
  );
}
