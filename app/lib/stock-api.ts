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
    // 한국투자증권 OpenAPI 비활성화 (UI 완성 후 다시 활성화 예정)
    // return await getStockPriceFromKIS(code);
    
    // 네이버 금융 사용
    return await getStockPriceFromNaver(code);
    
  } catch (error) {
    console.error('[Stock API] 에러 발생:', error);
    console.error('[Stock API] 에러 스택:', error instanceof Error ? error.stack : 'No stack');
    // 폴백: 기본값 반환
    console.error('[Stock API] 최종 폴백: 기본값 반환');
    return {
      symbol: code,
      name: "삼성전자",
      currentPrice: 0,
      change: 500,
      changePercent: 0.67,
      timestamp: new Date().toISOString(),
    };
  }
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
    return await getStockPriceFromNaver(code);
  }
  
  // 한국투자증권 OpenAPI 엔드포인트
  // 실전투자: https://openapi.koreainvestment.com
  // 모의투자: https://openapivts.koreainvestment.com
  const isProduction = process.env.KIS_PRODUCTION === 'true' || import.meta.env?.KIS_PRODUCTION === 'true';
  const baseUrl = isProduction 
    ? 'https://openapi.koreainvestment.com'
    : 'https://openapivts.koreainvestment.com';
  
  console.log(`[Stock API] 한국투자증권 API 사용: ${isProduction ? '실전' : '모의'} 환경`);
  
  try {
    // 1. Access Token 발급
    // 참고: https://github.com/koreainvestment/open-trading-api
    const tokenUrl = `${baseUrl}/oauth2/tokenP`;
    console.log(`[Stock API] Access Token 요청: ${tokenUrl}`);
    
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
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error(`[Stock API] Token 요청 실패: ${errorText}`);
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      console.error(`[Stock API] Token 응답:`, JSON.stringify(tokenData, null, 2));
      throw new Error('Failed to get access token from response');
    }
    
    console.log(`[Stock API] Access Token 발급 성공`);
    
    // 2. 주식 현재가 조회
    // 한국투자증권 API: 주식현재가시세 (FHKST01010100)
    // 참고: https://github.com/koreainvestment/open-trading-api/blob/main/kis_github/examples_user/domestic_stock/domestic_stock_functions.py
    const priceUrl = `${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`;
    console.log(`[Stock API] 주식 가격 조회: ${priceUrl}, 종목코드: ${code}`);
    
    // URL 파라미터 구성
    const params = new URLSearchParams({
      fid_cond_mrkt_div_code: 'J', // J: 주식, Q: 코스닥
      fid_input_iscd: code,        // 종목코드 (6자리)
    });
    
    const priceResponse = await fetch(`${priceUrl}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${accessToken}`,
        'appkey': appKey,
        'appsecret': appSecret,
        'tr_id': 'FHKST01010100', // 주식현재가시세
        'tr_cont': 'N',            // 연속조회 여부 (N: 미사용)
        'custtype': 'P',           // 고객타입 (P: 개인, B: 법인)
      },
    });
    
    if (!priceResponse.ok) {
      const errorText = await priceResponse.text();
      console.error(`[Stock API] 가격 조회 실패: ${errorText}`);
      throw new Error(`Failed to get stock price: ${priceResponse.status} ${priceResponse.statusText}`);
    }
    
    const priceData = await priceResponse.json();
    console.log(`[Stock API] 가격 데이터:`, JSON.stringify(priceData, null, 2));
    
    // 한국투자증권 API 응답 구조 파싱
    // 응답 구조: { rt_cd: "0", msg_cd: "...", msg1: "...", output: { ... } }
    if (priceData.rt_cd !== '0') {
      throw new Error(`API Error: ${priceData.msg_cd} - ${priceData.msg1}`);
    }
    
    const output = priceData.output;
    if (!output) {
      throw new Error('No output data in API response');
    }
    
    // 한국투자증권 API 필드명 (공식 문서 기준)
    // stck_prpr: 주식 현재가
    // prdy_clpr: 전일 종가
    // prdy_vrss: 전일 대비
    // prdy_vrss_sign: 전일 대비 부호 (1: 상한, 2: 상승, 3: 보합, 4: 하한, 5: 하락)
    // prdy_ctrt: 전일 대비율
    // hts_kor_isnm: 한글 종목명
    const currentPrice = parseInt(String(output.stck_prpr || '0').replace(/,/g, ''));
    const previousClose = parseInt(String(output.prdy_clpr || '0').replace(/,/g, ''));
    const change = parseInt(String(output.prdy_vrss || '0').replace(/,/g, ''));
    const changePercent = parseFloat(String(output.prdy_ctrt || '0'));
    const name = output.hts_kor_isnm || "삼성전자";
    
    // 등락률이 없으면 계산
    const finalChangePercent = changePercent !== 0 
      ? changePercent 
      : (previousClose !== 0 ? (change / previousClose) * 100 : 0);
    
    if (currentPrice === 0) {
      throw new Error('Failed to parse stock price from KIS API - currentPrice is 0');
    }
    
    const result = {
      symbol: code,
      name,
      currentPrice,
      change: change !== 0 ? change : (currentPrice - previousClose),
      changePercent: Number(finalChangePercent.toFixed(2)),
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[Stock API] 한국투자증권 API 결과:`, JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error('[Stock API] 한국투자증권 API 에러:', error);
    console.log('[Stock API] 폴백으로 네이버 금융을 시도합니다.');
    // 폴백: 네이버 금융 사용
    return await getStockPriceFromNaver(code);
  }
}

/**
 * 네이버 금융 페이지에서 주식 정보를 가져옵니다 (폴백용)
 */
async function getStockPriceFromNaver(code: string): Promise<StockPrice> {
  const url = `https://finance.naver.com/item/main.naver?code=${code}`;
  console.log(`[Stock API] 네이버 금융 URL: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://finance.naver.com/',
    },
  });

  console.log(`[Stock API] 네이버 금융 응답 상태: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Naver page: ${response.status}`);
  }

  const html = await response.text();
  console.log(`[Stock API] HTML 길이: ${html.length}자`);
  
  // 네이버 금융 페이지에서 현재가 추출
  // 현재가는 <p class="no_today"> 태그 안에 있음
  const todayMatch = html.match(/<p[^>]*class="no_today"[^>]*>[\s\S]*?<span[^>]*class="blind">([^<]+)<\/span>/);
  
  // 전일 종가 찾기
  const prevCloseMatch = html.match(/<td[^>]*>전일종가[\s\S]*?<span[^>]*class="blind">([^<]+)<\/span>/);
  
  // 등락액 찾기
  const changeMatch = html.match(/<span[^>]*class="(?:blind|tah p11|tah p12)"[^>]*>([+-]?\d{1,3}(?:,\d{3})*)<\/span>/);
  
  // 등락률 찾기
  const changePercentMatch = html.match(/<span[^>]*class="(?:blind|tah p11|tah p12)"[^>]*>([+-]?\d+\.\d+)%<\/span>/);
  
  // 종목명 찾기
  const nameMatch = html.match(/<h2[^>]*class="wrap_company"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
  
  console.log(`[Stock API] 네이버 todayMatch (현재가):`, todayMatch?.[1]);
  console.log(`[Stock API] 네이버 prevCloseMatch (전일종가):`, prevCloseMatch?.[1]);
  console.log(`[Stock API] 네이버 changeMatch:`, changeMatch?.[1]);
  console.log(`[Stock API] 네이버 changePercentMatch:`, changePercentMatch?.[1]);
  console.log(`[Stock API] 네이버 nameMatch:`, nameMatch?.[1]);
  
  if (todayMatch) {
    const currentPrice = parseInt(todayMatch[1].replace(/,/g, ''));
    const previousClose = prevCloseMatch ? parseInt(prevCloseMatch[1].replace(/,/g, '')) : currentPrice;
    const change = changeMatch ? parseInt(changeMatch[1].replace(/,/g, '')) : (currentPrice - previousClose);
    const changePercent = changePercentMatch 
      ? parseFloat(changePercentMatch[1])
      : (previousClose !== 0 ? (change / previousClose) * 100 : 0);
    const name = nameMatch ? nameMatch[1].trim() : "삼성전자";

    const result = {
      symbol: code,
      name,
      currentPrice,
      change,
      changePercent: Number(changePercent.toFixed(2)),
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[Stock API] 네이버 금융 파싱 결과:`, JSON.stringify(result, null, 2));
    console.log(`[Stock API] 장 상태: ${isMarketOpen() ? '개장 중 - 실시간 가격' : '마감 - 종가'}`);
    return result;
  }

  console.error(`[Stock API] 네이버 금융 파싱 실패 - todayMatch를 찾을 수 없음`);
  throw new Error('Could not parse stock price from Naver');
}

/**
 * 다음 금융 API에서 주식 정보를 가져옵니다 (폴백용)
 * 다음 금융의 실제 API 엔드포인트 사용
 */
async function getStockPriceFromDaum(code: string): Promise<StockPrice> {
  // 다음 금융의 실제 API 엔드포인트 사용
  // wisefn.finance.daum.net/v1 API 사용
  const apiUrl = `https://wisefn.finance.daum.net/v1/company/c1010001.aspx?cmp_cd=${code}&frq=0&rlt=1&frqTyp=0&cn=&gubun=1010`;
  console.log(`[Stock API] 다음 금융 API URL: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://finance.daum.net/',
      },
    });

    console.log(`[Stock API] 다음 금융 API 응답 상태: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const text = await response.text();
      console.log(`[Stock API] 다음 금융 API 응답 (처음 500자):`, text.substring(0, 500));
      
      // JSONP 형식일 수 있으므로 파싱 시도
      try {
        // JSONP 제거 시도
        const jsonText = text.replace(/^[^(]*\(/, '').replace(/\);?$/, '');
        const data = JSON.parse(jsonText);
        console.log(`[Stock API] 파싱된 데이터:`, JSON.stringify(data, null, 2).substring(0, 1000));
        
        // 데이터 구조에 따라 가격 찾기
        if (data && (data.현재가 || data.price || data.prpr)) {
          const currentPrice = parseInt(String(data.현재가 || data.price || data.prpr || '0').replace(/,/g, ''));
          const change = parseInt(String(data.전일대비 || data.change || data.diff || '0').replace(/,/g, ''));
          const changePercent = parseFloat(String(data.등락률 || data.changePercent || data.rate || '0'));
          const name = data.종목명 || data.name || "삼성전자";
          
          if (currentPrice > 0) {
            const result = {
              symbol: code,
              name,
              currentPrice,
              change,
              changePercent: Number(changePercent.toFixed(2)),
              timestamp: new Date().toISOString(),
            };
            
            console.log(`[Stock API] 다음 금융 API 결과:`, JSON.stringify(result, null, 2));
            return result;
          }
        }
      } catch (parseError) {
        console.log(`[Stock API] JSON 파싱 실패:`, parseError);
      }
    }
  } catch (apiError) {
    console.log(`[Stock API] 다음 금융 API 실패:`, apiError);
  }
  
  // 폴백: 페이지에서 파싱 시도
  const url = `https://finance.daum.net/quotes/A${code}`;
  console.log(`[Stock API] 다음 금융 페이지 파싱 시도: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Referer': 'https://finance.daum.net/',
    },
  });

  console.log(`[Stock API] 다음 금융 페이지 응답 상태: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch Daum page: ${response.status}`);
  }

  const html = await response.text();
  console.log(`[Stock API] HTML 길이: ${html.length}자`);
  
  // 다음 금융 페이지에서 현재가 추출
  // 방법 1: JSON 데이터 찾기 (다양한 패턴 시도)
  const jsonPatterns = [
    /window\.__PRELOADED_STATE__\s*=\s*({.+?});/,
    /window\.__INITIAL_STATE__\s*=\s*({.+?});/,
    /"currentPrice":\s*(\d+)/,
    /"price":\s*(\d+)/,
    /"now":\s*(\d+)/,
  ];
  
  for (const pattern of jsonPatterns) {
    const match = html.match(pattern);
    if (match) {
      console.log(`[Stock API] JSON 패턴 매치:`, pattern.toString());
      try {
        if (pattern.source.includes('PRELOADED_STATE') || pattern.source.includes('INITIAL_STATE')) {
          const jsonData = JSON.parse(match[1]);
          console.log(`[Stock API] JSON 데이터:`, JSON.stringify(jsonData, null, 2).substring(0, 1000));
          
          // 깊이 우선 탐색으로 가격 찾기
          const findPrice = (obj: any): number | null => {
            if (typeof obj === 'number' && obj > 1000 && obj < 1000000) return obj;
            if (typeof obj === 'string' && /^\d{4,6}$/.test(obj)) return parseInt(obj);
            if (typeof obj === 'object' && obj !== null) {
              for (const key in obj) {
                if (key.toLowerCase().includes('price') || key.toLowerCase().includes('now') || key.toLowerCase().includes('current')) {
                  const val = obj[key];
                  if (typeof val === 'number' && val > 1000) return val;
                  if (typeof val === 'string' && /^\d{4,6}$/.test(val)) return parseInt(val);
                }
                const found = findPrice(obj[key]);
                if (found) return found;
              }
            }
            return null;
          };
          
          const price = findPrice(jsonData);
          if (price) {
            console.log(`[Stock API] JSON에서 가격 발견: ${price}`);
            // 등락 정보도 찾기
            const findChange = (obj: any): { change: number; changePercent: number } | null => {
              if (typeof obj === 'object' && obj !== null) {
                const change = obj.change || obj.diff || obj.changeAmount;
                const changePercent = obj.changePercent || obj.rate || obj.changeRate;
                if (change !== undefined || changePercent !== undefined) {
                  return {
                    change: typeof change === 'number' ? change : parseInt(String(change || '0').replace(/,/g, '')),
                    changePercent: typeof changePercent === 'number' ? changePercent : parseFloat(String(changePercent || '0')),
                  };
                }
                for (const key in obj) {
                  const found = findChange(obj[key]);
                  if (found) return found;
                }
              }
              return null;
            };
            
            const changeInfo = findChange(jsonData) || { change: 0, changePercent: 0 };
            const name = jsonData.stockName || jsonData.name || jsonData.stock?.name || "삼성전자";
            
            const result = {
              symbol: code,
              name,
              currentPrice: price,
              change: changeInfo.change,
              changePercent: Number(changeInfo.changePercent.toFixed(2)),
              timestamp: new Date().toISOString(),
            };
            
            console.log(`[Stock API] 다음 금융 JSON 파싱 결과:`, JSON.stringify(result, null, 2));
            return result;
          }
        } else {
          // 직접 숫자 매치
          const price = parseInt(match[1]);
          if (price > 1000 && price < 1000000) {
            console.log(`[Stock API] 직접 가격 매치: ${price}`);
            const result = {
              symbol: code,
              name: "삼성전자",
              currentPrice: price,
              change: 0,
              changePercent: 0,
              timestamp: new Date().toISOString(),
            };
            return result;
          }
        }
      } catch (parseError) {
        console.log(`[Stock API] JSON 파싱 실패:`, parseError);
      }
    }
  }
  
  // 방법 2: HTML에서 직접 파싱 (더 다양한 패턴 시도)
  const pricePatterns = [
    /<span[^>]*class="[^"]*num[^"]*"[^>]*>([\d,]+)<\/span>/,
    /<em[^>]*class="[^"]*num[^"]*"[^>]*>([\d,]+)<\/em>/,
    /<strong[^>]*class="[^"]*num[^"]*"[^>]*>([\d,]+)<\/strong>/,
    /현재가[^<]*<[^>]*>([\d,]+)/i,
    /"price":\s*"([\d,]+)"/,
    /data-price="([\d,]+)"/,
  ];
  
  let priceMatch = null;
  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseInt(match[1].replace(/,/g, ''));
      if (price > 1000 && price < 1000000) {
        priceMatch = match;
        console.log(`[Stock API] 가격 패턴 매치: ${pattern.toString()} -> ${price}`);
        break;
      }
    }
  }
  
  const changeMatch = html.match(/([+-]?\d{1,3}(?:,\d{3})*)\s*원/);
  const changePercentMatch = html.match(/([+-]?\d+\.\d+)%/);
  const nameMatch = html.match(/<title>([^<]+)<\/title>/);
  
  console.log(`[Stock API] priceMatch:`, priceMatch?.[1]);
  console.log(`[Stock API] changeMatch:`, changeMatch?.[1]);
  console.log(`[Stock API] changePercentMatch:`, changePercentMatch?.[1]);
  console.log(`[Stock API] nameMatch:`, nameMatch?.[1]);
  
  if (priceMatch) {
    const currentPrice = parseInt(priceMatch[1].replace(/,/g, ''));
    const change = changeMatch ? parseInt(changeMatch[1].replace(/,/g, '')) : 0;
    const changePercent = changePercentMatch 
      ? parseFloat(changePercentMatch[1])
      : 0;
    const name = nameMatch ? nameMatch[1].split(' :')[0].trim() : "삼성전자";

    const result = {
      symbol: code,
      name,
      currentPrice,
      change,
      changePercent: Number(changePercent.toFixed(2)),
      timestamp: new Date().toISOString(),
    };
    
    console.log(`[Stock API] 다음 금융 HTML 파싱 결과:`, JSON.stringify(result, null, 2));
    console.log(`[Stock API] 장 상태: ${isMarketOpen() ? '개장 중 - 실시간 가격' : '마감 - 종가'}`);
    return result;
  }

  // 마지막 시도: HTML 전체에서 숫자 패턴 찾기 (4-6자리 숫자)
  const allNumbers = html.match(/\b(\d{4,6})\b/g);
  const potentialPrices = allNumbers?.filter(num => {
    const n = parseInt(num);
    return n > 10000 && n < 200000; // 삼성전자 가격 범위
  });
  
  console.log(`[Stock API] 발견된 잠재적 가격들:`, potentialPrices);
  
  if (potentialPrices && potentialPrices.length > 0) {
    // 가장 많이 나타나는 숫자가 현재가일 가능성이 높음
    const priceCounts = potentialPrices.reduce((acc: Record<string, number>, price) => {
      acc[price] = (acc[price] || 0) + 1;
      return acc;
    }, {});
    
    const mostCommonPrice = Object.entries(priceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    
    if (mostCommonPrice) {
      const currentPrice = parseInt(mostCommonPrice);
      console.log(`[Stock API] 가장 많이 나타나는 가격: ${currentPrice}`);
      
      const result = {
        symbol: code,
        name: "삼성전자",
        currentPrice,
        change: 0,
        changePercent: 0,
        timestamp: new Date().toISOString(),
      };
      
      console.log(`[Stock API] 추정 가격 결과:`, JSON.stringify(result, null, 2));
      return result;
    }
  }
  
  console.error(`[Stock API] 다음 금융 파싱 실패 - 모든 패턴 시도 실패`);
  throw new Error('Could not parse stock price from Daum');
}

/**
 * 오늘 날짜를 YYYYMMDD 형식으로 반환
 */
function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * 여러 주식의 가격을 한번에 가져옵니다
 */
export async function getMultipleStockPrices(symbols: string[]): Promise<StockPrice[]> {
  return Promise.all(symbols.map(symbol => getStockPrice(symbol)));
}
