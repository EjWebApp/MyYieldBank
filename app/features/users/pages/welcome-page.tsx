import { Resend } from "resend";
import { render } from "@react-email/components";
import { WelcomeUser } from "react-email-starter/emails/welcome-user";
import type{ Route } from "./+types/welcome-page";

const client = new Resend(process.env.RESEND_API_KEY);

/**
 * 웰컴 이메일 발송 함수
 * @param request - Request 객체 (baseUrl 추출용)
 * @param email - 수신자 이메일 주소
 * @param userName - 사용자 이름
 * @returns 이메일 발송 결과
 */
export async function sendWelcomeEmail(
  request: Request,
  email: string,
  userName: string
) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const { data, error } = await client.emails.send({
    from: "admin <admin@mail.moneylab.blog>",
    to: [email],
    subject: {userName}+"!! Welcome to MyYieldBank",
    react: <WelcomeUser userName={userName} baseUrl={baseUrl} />,
  });
  
  return { data, error };
}

export const loader = async ({ params, request }: Route.LoaderArgs) => {
  const { data, error } = await sendWelcomeEmail(
    request,
    "{params.email}",
    "{params.username}"
  );
  return Response.json({ data, error });
};