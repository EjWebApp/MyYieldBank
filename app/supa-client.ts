import { createClient } from "@supabase/supabase-js";
import type { MergeDeep, SetNonNullable, SetFieldType } from "type-fest";
import type { Database as SupabaseDatabase } from "../database.types";
import {
  createBrowserClient,
  createServerClient,
  parseCookieHeader,
  serializeCookieHeader,
  type CookieOptions,
} from "@supabase/ssr";
export type Database = MergeDeep<
  SupabaseDatabase,
  {
    public: {
      Views: {
        community_post_list_view: {
          Row: SetFieldType<
            SetNonNullable<
              SupabaseDatabase["public"]["Views"]["community_post_list_view"]["Row"]
            >,
            "author_avatar",
            string | null
          >;
        };
        product_overview_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["product_overview_view"]["Row"]
          >;
        };
        community_post_detail: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["community_post_detail"]["Row"]
          >;
        };
        gpt_ideas_view: {
          Row: SetNonNullable<
            SupabaseDatabase["public"]["Views"]["gpt_ideas_view"]["Row"]
          >;
        };
      };
    };
  }
>;

// 환경 변수 가져오기 (Vite: 브라우저는 import.meta.env, 서버는 process.env)
function getSupabaseUrl(): string {
  // 서버 사이드에서는 process.env 사용, 브라우저에서는 import.meta.env 사용
  const url = 
    (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL);
  
  if (!url) {
    throw new Error(
      "SUPABASE_URL 환경변수가 설정되지 않았습니다. .env 파일에 SUPABASE_URL (서버) 또는 VITE_SUPABASE_URL (브라우저)을 설정해주세요."
    );
  }
  return url;
}

function getSupabaseAnonKey(): string {
  // 서버 사이드에서는 process.env 사용, 브라우저에서는 import.meta.env 사용
  const key = 
    (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY);
  
  if (!key) {
    throw new Error(
      "SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다. .env 파일에 SUPABASE_ANON_KEY (서버) 또는 VITE_SUPABASE_ANON_KEY (브라우저)을 설정해주세요."
    );
  }
  return key;
}

// 브라우저 클라이언트는 지연 초기화 (모듈 로드 시점에 환경 변수가 없을 수 있음)
let _browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getBrowserClient() {
  if (!_browserClient) {
    _browserClient = createBrowserClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    );
  }
  return _browserClient;
}

// 기존 코드와의 호환성을 위한 getter (지연 초기화)
export const browserClient = new Proxy({} as ReturnType<typeof createBrowserClient<Database>>, {
  get(_target, prop) {
    return getBrowserClient()[prop as keyof ReturnType<typeof createBrowserClient<Database>>];
  }
});

type SSRClientBundle = {
  client: ReturnType<typeof createServerClient<Database>>;
  headers: Headers;
};

/** 한 HTTP 요청 안에서 root·자식 loader가 각각 makeSSRClient를 호출해도 동일 인스턴스를 쓰게 해 리프레시/에러 로그 중복을 줄임 */
const ssrClientByRequest = new WeakMap<Request, SSRClientBundle>();

export const makeSSRClient = (request: Request): SSRClientBundle => {
  const existing = ssrClientByRequest.get(request);
  if (existing) return existing;

  const headers = new Headers();
  const serverSideClient = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          const cookies = parseCookieHeader(request.headers.get("Cookie") ?? "");
          return cookies.filter((cookie): cookie is { name: string; value: string } => 
            cookie.value !== undefined
          );
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            headers.append(
              "Set-Cookie",
              serializeCookieHeader(name, value, options)
            );
          });
        },
      },
    }
  );

  const bundle = { client: serverSideClient, headers };
  ssrClientByRequest.set(request, bundle);
  return bundle;
};

/** refresh token 폐기/불일치 시 getUser()가 내는 오류 — 쿠키를 지우지 않으면 매 요청마다 리프레시 재시도 */
export function isInvalidRefreshSessionError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === "refresh_token_not_found" ||
    (typeof e.message === "string" &&
      e.message.toLowerCase().includes("refresh token"))
  );
}
