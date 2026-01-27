import { Form, redirect } from "react-router";
import type { Route } from "./+types/opt-complete-page";
import { Button } from "~/common/components/ui/button";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const code = formData.get("code");

  // TODO: 실제 OTP 검증 로직 구현
  console.log("OTP complete:", { code });

  // 임시로 홈으로 리다이렉트
  return redirect("/home");
}

export default function OptCompletePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">OTP 인증 완료</h1>
        <p className="text-muted-foreground">
          이메일로 받은 인증 코드를 입력하세요
        </p>
      </div>
      <Form method="post" className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="code" className="text-sm font-medium">
            인증 코드
          </label>
          <input
            id="code"
            name="code"
            type="text"
            required
            maxLength={6}
            className="w-full px-3 py-2 border rounded-md text-center text-2xl tracking-widest"
            placeholder="000000"
          />
        </div>
        <Button type="submit" className="w-full">
          인증 완료
        </Button>
      </Form>
    </div>
  );
}
