import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";

// DATABASE_URL을 올바르게 인코딩하는 함수
function encodeDatabaseUrl(databaseUrl: string): string {
  // DATABASE_URL에서 따옴표 제거 (환경변수가 따옴표로 감싸져 있을 수 있음)
  let cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

  // DATABASE_URL을 수동으로 파싱하여 각 부분을 올바르게 인코딩
  // postgresql://username:password@host:port/database 형식
  const atIndex = cleanDatabaseUrl.indexOf('@');
  if (atIndex > 0) {
    const beforeAt = cleanDatabaseUrl.substring(0, atIndex);
    const afterAt = cleanDatabaseUrl.substring(atIndex + 1);
    
    // 프로토콜 부분 추출 (postgresql:// 또는 postgres://)
    const protocolMatch = beforeAt.match(/^(postgresql?:\/\/)/);
    if (protocolMatch) {
      const protocol = protocolMatch[1];
      const authPart = beforeAt.substring(protocol.length);
      
      // username:password 분리
      const colonIndex = authPart.indexOf(':');
      if (colonIndex > 0) {
        const username = authPart.substring(0, colonIndex);
        const password = authPart.substring(colonIndex + 1);
        
        // 각 부분을 URL 인코딩 (이미 인코딩된 경우를 고려하여 decodeURIComponent 후 encodeURIComponent)
        let encodedUsername: string;
        let encodedPassword: string;
        
        try {
          encodedUsername = encodeURIComponent(decodeURIComponent(username));
        } catch {
          encodedUsername = encodeURIComponent(username);
        }
        
        try {
          encodedPassword = encodeURIComponent(decodeURIComponent(password));
        } catch {
          encodedPassword = encodeURIComponent(password);
        }
        
        cleanDatabaseUrl = `${protocol}${encodedUsername}:${encodedPassword}@${afterAt}`;
      } else {
        // password가 없는 경우
        try {
          const encodedUsername = encodeURIComponent(decodeURIComponent(authPart));
          cleanDatabaseUrl = `${protocol}${encodedUsername}@${afterAt}`;
        } catch {
          const encodedUsername = encodeURIComponent(authPart);
          cleanDatabaseUrl = `${protocol}${encodedUsername}@${afterAt}`;
        }
      }
    }
  }
  
  return cleanDatabaseUrl;
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.");
}

// URL 인코딩 처리
const encodedDatabaseUrl = encodeDatabaseUrl(databaseUrl);

// postgres.js 클라이언트 생성
// AWS 환경 등에서는 prepared statements를 비활성화해야 할 수 있음
const queryClient = postgres(encodedDatabaseUrl, { prepare: false });

// Drizzle ORM 초기화 (공식 문서 방식)
export const db = drizzle({ client: queryClient });