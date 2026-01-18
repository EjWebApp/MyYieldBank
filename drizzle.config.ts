// .env 파일에서 환경변수 자동 로드 (ES 모듈 방식)
import "dotenv/config";
import {defineConfig} from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error(`[drizzle.config] DATABASE_URL이 설정되지 않았습니다.`);
    console.error(`[drizzle.config] .env 파일이 존재하는지 확인하고, DATABASE_URL을 설정해주세요.`);
    console.error(`[drizzle.config] 예시: DATABASE_URL=postgresql://user:password@host:port/database`);
    throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.");
}

// DATABASE_URL에서 따옴표 제거 (환경변수가 따옴표로 감싸져 있을 수 있음)
let cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();

// DATABASE_URL을 수동으로 파싱하여 각 부분을 올바르게 인코딩
// postgresql://username:password@host:port/database 형식
// @ 기호를 기준으로 앞부분(프로토콜+인증정보)과 뒷부분(호스트+포트+경로)으로 분리
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
                // 이미 인코딩된 경우를 처리
                encodedUsername = encodeURIComponent(decodeURIComponent(username));
            } catch {
                encodedUsername = encodeURIComponent(username);
            }
            
            try {
                // password에 특수 문자(% # ? 등)가 포함되어 있을 수 있으므로 인코딩
                encodedPassword = encodeURIComponent(decodeURIComponent(password));
            } catch {
                encodedPassword = encodeURIComponent(password);
            }
            
            // URL 재구성
            cleanDatabaseUrl = `${protocol}${encodedUsername}:${encodedPassword}@${afterAt}`;
            console.log(`[drizzle.config] DATABASE_URL의 username과 password를 URL 인코딩했습니다.`);
        } else {
            // password가 없는 경우 (username만 있는 경우)
            try {
                const encodedUsername = encodeURIComponent(decodeURIComponent(authPart));
                cleanDatabaseUrl = `${protocol}${encodedUsername}@${afterAt}`;
            } catch {
                const encodedUsername = encodeURIComponent(authPart);
                cleanDatabaseUrl = `${protocol}${encodedUsername}@${afterAt}`;
            }
        }
    }
} else {
    // @ 기호가 없는 경우 URL 파싱 시도
    try {
        new URL(cleanDatabaseUrl);
        console.log(`[drizzle.config] DATABASE_URL이 이미 올바른 형식입니다.`);
    } catch (error) {
        // postgresql:// 형식인지 확인
        if (!cleanDatabaseUrl.startsWith('postgresql://') && !cleanDatabaseUrl.startsWith('postgres://')) {
            console.error(`[drizzle.config] DATABASE_URL이 올바른 PostgreSQL connection string 형식이 아닙니다.`);
            console.error(`[drizzle.config] postgresql:// 또는 postgres://로 시작해야 합니다.`);
            throw new Error("DATABASE_URL이 올바른 PostgreSQL connection string 형식이 아닙니다.");
        }
        console.warn(`[drizzle.config] DATABASE_URL 파싱 경고: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

export default defineConfig({
    schema: "./app/features/**/schema.ts",
    out: "./app/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: cleanDatabaseUrl,
    },
});