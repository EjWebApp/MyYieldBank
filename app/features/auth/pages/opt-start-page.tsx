import { Form, redirect } from "react-router";
import type { Route } from "./+types/opt-start-page";
import { Button } from "~/common/components/ui/button";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get("email");

  // TODO: 실제 OTP 전송 로직 구현
  console.log("OTP start:", { email });

  // 임시로 OTP 완료 페이지로 리다이렉트
  return redirect("/auth/opt/complete");
}

export default function OptStartPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">OTP 인증</h1>
        <p className="text-muted-foreground">
          이메일로 인증 코드를 전송합니다
        </p>
      </div>
      <Form method="post" className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2 border rounded-md"
            placeholder="email@example.com"
          />
        </div>
        <Button type="submit" className="w-full">
          인증 코드 전송
        </Button>
      </Form>
    </div>
  );
}
