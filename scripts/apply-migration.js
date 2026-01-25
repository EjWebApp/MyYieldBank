import postgres from "postgres";
import "dotenv/config";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

// URL 인코딩 처리
function encodeDatabaseUrl(databaseUrl) {
  let cleanDatabaseUrl = databaseUrl.replace(/^["']|["']$/g, '').trim();
  const atIndex = cleanDatabaseUrl.indexOf('@');
  if (atIndex > 0) {
    const beforeAt = cleanDatabaseUrl.substring(0, atIndex);
    const afterAt = cleanDatabaseUrl.substring(atIndex + 1);
    const protocolMatch = beforeAt.match(/^(postgresql?:\/\/)/);
    if (protocolMatch) {
      const protocol = protocolMatch[1];
      const authPart = beforeAt.substring(protocol.length);
      const colonIndex = authPart.indexOf(':');
      if (colonIndex > 0) {
        const username = authPart.substring(0, colonIndex);
        const password = authPart.substring(colonIndex + 1);
        let encodedUsername, encodedPassword;
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
      }
    }
  }
  return cleanDatabaseUrl;
}

const sql = postgres(encodeDatabaseUrl(databaseUrl), { prepare: false });

async function applyMigration() {
  try {
    console.log("마이그레이션 적용 시작...");
    
    // 마이그레이션 SQL 파일 읽기
    const migrationPath = join(__dirname, "../app/migrations/0001_update_profit_rates.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");
    
    console.log("실행할 SQL:");
    console.log(migrationSQL);
    
    console.log("SQL 실행 중...");
    await sql.unsafe(migrationSQL);
    
    console.log("✓ 마이그레이션 적용 완료!");
  } catch (error) {
    console.error("마이그레이션 적용 실패:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyMigration();
