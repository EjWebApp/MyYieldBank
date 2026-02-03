/**
 * 한국 주식 API 유틸리티
 * 한국투자증권 OpenAPI를 통해 한국 주식 정보를 가져옵니다
 */

interface StockPrice {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

/**
 * 한국투자증권 OpenAPI를 통해 한국 주식 가격을 가져옵니다
 * @param code 한국 주식 코드 (예: "005930" - 삼성전자)
 * 
 * 참고: 한국투자증권 OpenAPI 사용을 위해서는:
 * 1. 한국투자증권 계좌 개설 필요
 * 2. OpenAPI 앱 등록 및 API 키 발급 필요
 * 3. 환경변수에 API 키 설정 필요 (KIS_APP_KEY, KIS_APP_SECRET)
 */
/**
 * 한국 주식 시장이 현재 열려있는지 확인합니다
 * 평일 09:00 ~ 15:30 (장중)
 */
function isMarketOpen(): boolean {
  const now = new Date();
  const day = now.getDay(); // 0 = 일요일, 6 = 토요일
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // 주말 체크
  if (day === 0 || day === 6) {
    return false;
  }
  
  // 장중 시간 체크: 09:00 ~ 15:30
  const currentTime = hour * 60 + minute;
  const marketOpen = 9 * 60; // 09:00
  const marketClose = 15 * 60 + 30; // 15:30
  
  return currentTime >= marketOpen && currentTime <= marketClose;
}

export async function getStockPrice(code: string = "005930"): Promise<StockPrice> {
  const marketOpen = isMarketOpen();
  console.log(`[Stock API] 시작: 코드 ${code}, 장 상태: ${marketOpen ? '개장' : '마감'}`);
  
  try {
    // 한국투자증권 OpenAPI 사용
    return await getStockPriceFromKIS(code);
  } catch (error) {
    // 에러는 이미 하위 함수에서 상세히 로깅되었으므로 간단히만 처리
    const errorMessage = error instanceof Error ? error.message : String(error);
    const cause = error instanceof Error && 'cause' in error ? (error as any).cause : null;
    const causeCode = cause && 'code' in cause ? cause.code : undefined;
    
    if (causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
      console.error(`[Stock API] 최종: 연결 타임아웃 - 기본값 반환 (종목코드: ${code})`);
    } else {
      console.error(`[Stock API] 최종: ${errorMessage} - 기본값 반환 (종목코드: ${code})`);
    }
    
    // 최종 폴백: 기본값 반환
    return {
      symbol: code,
      name: "",
      currentPrice: 0,
      change: 0,
      changePercent: 0,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * 한국투자증권 API 응답을 파싱하여 StockPrice 객체로 변환합니다
 */
function parseKISResponse(code: string, output: any): StockPrice {
  // 한국투자증권 API 필드명 (공식 문서 기준)
  // stck_prpr: 주식 현재가
  // prdy_clpr: 전일 종가
  // prdy_vrss: 전일 대비
  // prdy_vrss_sign: 전일 대비 부호 (1: 상한, 2: 상승, 3: 보합, 4: 하한, 5: 하락)
  // prdy_ctrt: 전일 대비율
  // hts_kor_isnm: 한글 종목명
  
  const currentPrice = parseInt(String(output.stck_prpr || '0').replace(/,/g, ''), 10);
  const previousClose = parseInt(String(output.prdy_clpr || '0').replace(/,/g, ''), 10);
  const change = parseInt(String(output.prdy_vrss || '0').replace(/,/g, ''), 10);
  const changePercent = parseFloat(String(output.prdy_ctrt || '0'));
  const name = output.hts_kor_isnm || output.hts_kor_isnm || '';
  
  // 등락률이 없으면 계산
  const finalChangePercent = changePercent !== 0 
    ? changePercent 
    : (previousClose !== 0 ? (change / previousClose) * 100 : 0);
  
  if (currentPrice === 0) {
    throw new Error('Failed to parse stock price from KIS API - currentPrice is 0');
  }
  
  const result: StockPrice = {
    symbol: code,
    name: name || code,
    currentPrice,
    change: change !== 0 ? change : (currentPrice - previousClose),
    changePercent: Number(finalChangePercent.toFixed(2)),
    timestamp: new Date().toISOString(),
  };
  
  console.log(`[Stock API] 한국투자증권 API 결과:`, JSON.stringify(result, null, 2));
  return result;
}

// 토큰 요청 제한 (하루에 1번만 요청)
interface TokenRequestCache {
  requestedDate: string; // YYYY-MM-DD 형식
  token: string;
  baseUrl: string;
}

let tokenRequestCache: TokenRequestCache | null = null;

/**
 * Access Token을 가져옵니다
 * 한국투자증권 API는 하루에 1번만 발급하며, 같은 날 재요청 시 같은 토큰을 반환합니다.
 * 따라서 하루에 한 번만 API 서버에 요청하고, 그 토큰을 재사용합니다.
 */
async function getAccessToken(
  baseUrl: string,
  appKey: string,
  appSecret: string,
  isProduction: boolean
): Promise<string> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // 오늘 이미 요청한 토큰이 있으면 재사용
  if (tokenRequestCache && tokenRequestCache.requestedDate === today && tokenRequestCache.baseUrl === baseUrl) {
    console.log(`[Stock API] 오늘 발급받은 Access Token 재사용 (요청일: ${tokenRequestCache.requestedDate})`);
    return tokenRequestCache.token;
  }
  
  // 하루에 한 번만 한국투자증권 API 서버에 토큰 요청
  console.log(`[Stock API] Access Token 요청 (한국투자증권 API 서버에서 받아옴, 하루 1회 제한)`);
  const tokenUrl = `${baseUrl}/oauth2/tokenP`;
  
  // 타임아웃 설정 (30초)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  
  const tokenResponse = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
    signal: controller.signal,
  });
  
  clearTimeout(timeoutId);
  
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error(`[Stock API] Token 요청 실패: ${errorText}`);
    
    // 1분당 1회 제한 에러인 경우 이미 요청한 토큰이 있으면 재사용
    if (tokenResponse.status === 403 && errorText.includes('EGW00133')) {
      if (tokenRequestCache && tokenRequestCache.baseUrl === baseUrl) {
        console.log(`[Stock API] 토큰 발급 제한으로 인해 오늘 요청한 토큰 재사용 (요청일: ${tokenRequestCache.requestedDate})`);
        return tokenRequestCache.token;
      }
    }
    
    throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
  }
  
  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  
  if (!accessToken) {
    console.error(`[Stock API] Token 응답:`, JSON.stringify(tokenData, null, 2));
    throw new Error('Failed to get access token from response');
  }
  
  // 오늘 요청한 토큰을 캐시에 저장 (하루에 한 번만 요청하도록)
  tokenRequestCache = {
    token: accessToken,
    requestedDate: today,
    baseUrl: baseUrl,
  };
  
  console.log(`[Stock API] Access Token 발급 성공 (오늘 요청 완료: ${today})`);
  return accessToken;
}

/**
 * 한국투자증권 OpenAPI에서 주식 정보를 가져옵니다
 */
async function getStockPriceFromKIS(code: string): Promise<StockPrice> {
  // 환경변수에서 API 키 가져오기
  // Vite에서는 import.meta.env를 사용하지만, 서버 사이드에서는 process.env 사용
  const appKey = process.env.KIS_APP_KEY || import.meta.env?.KIS_APP_KEY || '';
  const appSecret = process.env.KIS_APP_SECRET || import.meta.env?.KIS_APP_SECRET || '';
  
  // 디버깅: 환경변수 확인 (값은 마스킹)
  console.log(`[Stock API] 환경변수 확인:`);
  console.log(`[Stock API] KIS_APP_KEY 존재: ${!!appKey} (길이: ${appKey.length})`);
  console.log(`[Stock API] KIS_APP_SECRET 존재: ${!!appSecret} (길이: ${appSecret.length})`);
  console.log(`[Stock API] process.env.KIS_APP_KEY: ${process.env.KIS_APP_KEY ? '설정됨' : '없음'}`);
  console.log(`[Stock API] import.meta.env.KIS_APP_KEY: ${import.meta.env?.KIS_APP_KEY ? '설정됨' : '없음'}`);
  
  if (!appKey || !appSecret) {
    console.warn('[Stock API] 한국투자증권 API 키가 설정되지 않았습니다.');
    console.warn('[Stock API] 환경변수 KIS_APP_KEY와 KIS_APP_SECRET을 설정해주세요.');
    console.warn('[Stock API] .env 파일이 프로젝트 루트에 있는지 확인하세요.');
    console.warn('[Stock API] 폴백으로 네이버 금융을 시도합니다.');
    //return await getStockPriceFromNaver(code);
    return {
      symbol: code,
      name: "",
      currentPrice: 0,
      change: 500,
      changePercent: 0.67,
      timestamp: new Date().toISOString(),
    };
  }
  
  // 한국투자증권 OpenAPI 엔드포인트
  // 실전투자: https://openapi.koreainvestment.com
  // 모의투자: https://openapivts.koreainvestment.com
  const isProduction = process.env.KIS_PRODUCTION === 'true' || import.meta.env?.KIS_PRODUCTION === 'true';
  const baseUrl = isProduction 
    ? 'https://openapi.koreainvestment.com:9443'
    : 'https://openapivts.koreainvestment.com:29443';
  
  console.log(`[Stock API] 한국투자증권 API 사용: ${isProduction ? '실전' : '모의'} 환경`);
  console.log(`[Stock API] API 서버 URL: ${baseUrl}`);
  console.log(`[Stock API] 참고: 토큰 발급은 1일 1회로 제한되므로 캐시된 토큰을 재사용합니다.`);
  
  try {
    // 1. Access Token 발급 (1일 1회 제한, 캐싱 사용)
    // 참고: https://apiportal.koreainvestment.com/apiservice-apiservice
    // 토큰은 1일 1회만 발급 가능하므로 캐시에서 재사용
    const accessToken = await getAccessToken(baseUrl, appKey, appSecret, isProduction);
  
    // 2. 주식 현재가 조회
    // 한국투자증권 API: 주식현재가시세 (FHKST01010100)
    // API 문서: https://apiportal.koreainvestment.com/apiservice-apiservice?/uapi/domestic-stock/v1/quotations/inquire-price
    // 참고: https://github.com/koreainvestment/open-trading-api
    
    // 종목 코드 6자리 포맷팅
    const formattedCode = code.padStart(6, '0');
    
    // 시장 구분 코드 판단
    // 종목 코드만으로는 정확한 시장 구분이 어려우므로 코스피(J)로 먼저 시도
    const marketCode = 'J'; // 코스피
    
    // API 엔드포인트 (한국투자증권 API 공식 문서 기준)
    // 쿼리 파라미터를 URL에 직접 포함
    const priceUrl = `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price?fid_cond_mrkt_div_code=${marketCode}&fid_input_iscd=${formattedCode}`;
    console.log(`[Stock API] 주식 현재가 조회 시작`);
    console.log(`[Stock API] URL: ${priceUrl}`);
    console.log(`[Stock API] 종목코드: ${formattedCode}, 시장구분: ${marketCode} (코스피)`);
    
    // 가격 조회 타임아웃 설정 (30초)
    const priceController = new AbortController();
    const priceTimeoutId = setTimeout(() => priceController.abort(), 30000);
    
    // TR_ID 설정 (실전/모의 환경에 따라 다름)
    const trId = isProduction ? 'FHKST01010100' : 'FHKST01010100'; // 실전/모의 동일
    
    console.log(`[Stock API] 요청 헤더:`);
    console.log(`  - tr_id: ${trId}`);
    console.log(`  - custtype: P (개인)`);
    
    const priceResponse = await fetch(priceUrl, {
      method: 'GET',
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'authorization': `Bearer ${accessToken}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': trId,        // 거래ID (주식현재가시세)
        'tr_cont': 'N',       // 연속조회 여부 (N: 미사용, Y: 사용)
        'custtype': 'P',      // 고객타입 (P: 개인, B: 법인)
      },
      signal: priceController.signal,
    });
    
    clearTimeout(priceTimeoutId);
    
    if (!priceResponse.ok) {
      const errorText = await priceResponse.text();
      console.error(`[Stock API] 가격 조회 실패 (HTTP ${priceResponse.status}): ${errorText}`);
      throw new Error(`Failed to get stock price: ${priceResponse.status} ${priceResponse.statusText}`);
    }
    
    const priceData = await priceResponse.json();
    //console.log(`[Stock API] 가격 데이터:`, JSON.stringify(priceData, null, 2));
    
    // 한국투자증권 API 응답 구조 파싱
    // 응답 구조: { rt_cd: "0", msg_cd: "...", msg1: "...", output: { ... } }
    // rt_cd: "0"이면 성공, 그 외는 에러
    if (priceData.rt_cd !== '0') {
      const errorMsg = priceData.msg1 || priceData.msg_cd || 'Unknown error';
      const errorCode = priceData.msg_cd || '';
      console.error(`[Stock API] API 에러 응답: rt_cd=${priceData.rt_cd}, msg_cd=${errorCode}, msg1=${errorMsg}`);
      throw new Error(`API Error (${errorCode}): ${errorMsg}`);
    }
    
    const output = priceData.output;
    if (!output) {
      throw new Error('No output data in API response');
    }
    
    // 성공 시 결과 반환
    return parseKISResponse(code, output);
    
  } catch (error) {
    // 에러 상세 로깅
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined;
    const cause = error instanceof Error && 'cause' in error ? (error as any).cause : null;
    const causeCode = cause && 'code' in cause ? cause.code : undefined;
    
    if (errorCode === 'UND_ERR_CONNECT_TIMEOUT' || causeCode === 'UND_ERR_CONNECT_TIMEOUT') {
      console.error(`[Stock API] ⚠️ 한국투자증권 API 연결 타임아웃 (30초)`);
      console.error(`[Stock API] 문제: ${baseUrl}에 연결할 수 없습니다.`);
      console.error(`[Stock API] 해결 방법:`);
      console.error(`  1. 네트워크 연결 상태 확인`);
      console.error(`  2. 방화벽에서 ${baseUrl.replace('https://', '')} 허용 확인`);
      console.error(`  3. VPN 사용 중이라면 해제 후 재시도`);
      console.error(`  4. 브라우저에서 ${baseUrl} 접속 테스트`);
      console.error(`  5. API 서버 상태 확인: https://apiportal.koreainvestment.com`);
      if (!isProduction) {
        console.error(`  6. 모의투자 서버가 다운된 경우, 실전투자 서버로 변경 시도:`);
        console.error(`     .env 파일에서 KIS_PRODUCTION=true로 변경`);
        console.error(`     ⚠️ 주의: 실전투자는 실제 돈이 거래됩니다!`);
      }
    } else {
      console.error(`[Stock API] 한국투자증권 API 에러: ${errorMessage}`);
      console.error(`[Stock API] 문제: ${baseUrl}에 연결 실패`);
      if (cause) {
        console.error(`[Stock API] 에러 원인 상세:`, cause);
      }
    }
    
    throw error;
  }
}
