// 주식 카탈로그 (종목명-종목코드 매핑)
// 하루에 한 번 갱신되는 데이터

let STOCK_CODE_MAP: Record<string, string> = {};
let lastUpdated: Date | null = null;
const UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24시간
let refreshPromise: Promise<void> | null = null; // 갱신 중인 Promise 캐싱

/**
 * 공공데이터포털 API에서 종목 정보를 가져옵니다
 */
async function fetchStockCatalogFromAPI(): Promise<Record<string, string>> {
  const API_KEY = process.env.DATA_GO_KR_API_KEY;
  
  if (!API_KEY) {
    console.warn('[Stock Catalog] DATA_GO_KR_API_KEY가 설정되지 않았습니다.');
    return {};
  }

  try {
    // 공공데이터포털 KRX상장종목정보 API
    // API 키 처리: 공공데이터포털은 인코딩된 키를 그대로 사용하거나 디코딩해서 사용
    let serviceKey: string;
    
    // API 키가 이미 URL 인코딩되어 있는 경우 (% 포함)
    if (API_KEY.includes('%')) {
      // 인코딩된 키를 그대로 사용 (공공데이터포털은 보통 이렇게 사용)
      serviceKey = API_KEY;
    } else {
      // 인코딩되지 않은 키는 인코딩
      serviceKey = encodeURIComponent(API_KEY);
    }
    
    const url = `https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo?serviceKey=${serviceKey}&numOfRows=10000&pageNo=1&resultType=json`;
    
    console.log('[Stock Catalog] API 호출 URL (키 마스킹):', url.replace(serviceKey, '***'));
    
    const response = await fetch(url);
    
    // 응답 상태 확인
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Stock Catalog] API 호출 실패 (HTTP ${response.status}):`, text.substring(0, 200));
      return {};
    }
    
    // Content-Type 확인
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Stock Catalog] JSON이 아닌 응답을 받았습니다:', text.substring(0, 200));
      return {};
    }
    
    const data = await response.json();
    
    // 응답 구조 확인
    if (!data.response) {
      console.error('[Stock Catalog] 예상치 못한 응답 구조:', JSON.stringify(data).substring(0, 200));
      return {};
    }
    
    if (data.response?.header?.resultCode !== '00') {
      console.error('[Stock Catalog] API 호출 실패:', data.response?.header?.resultMsg || data.response?.header?.resultMessage);
      return {};
    }

    const items = data.response?.body?.items?.item || [];
    const catalog: Record<string, string> = {};
    
    items.forEach((item: any) => {
      if (item.srtnCd && item.itmsNm) {
        catalog[item.itmsNm] = item.srtnCd; // 종목명: 종목코드
      }
    });

    console.log(`[Stock Catalog] ${Object.keys(catalog).length}개 종목 정보를 가져왔습니다.`);
    return catalog;
  } catch (error) {
    console.error('[Stock Catalog] API 호출 중 오류:', error);
    if (error instanceof Error) {
      console.error('[Stock Catalog] 에러 메시지:', error.message);
    }
    return {};
  }
}

/**
 * 주식 카탈로그를 갱신합니다 (24시간마다 자동 갱신)
 * 동시 호출 방지: 이미 갱신 중이면 기다림
 */
export async function refreshStockCatalog(): Promise<void> {
  // 이미 갱신 중이면 기다림
  if (refreshPromise) {
    console.log('[Stock Catalog] 이미 갱신 중입니다. 대기...');
    return refreshPromise;
  }
  
  const now = new Date();
  
  // 마지막 갱신 후 24시간이 지났거나, 아직 갱신하지 않은 경우
  if (!lastUpdated || (now.getTime() - lastUpdated.getTime()) >= UPDATE_INTERVAL_MS) {
    console.log('[Stock Catalog] 종목 카탈로그 갱신 시작...');
    
    // 갱신 Promise 생성 및 캐싱
    refreshPromise = (async () => {
      try {
        STOCK_CODE_MAP = await fetchStockCatalogFromAPI();
        lastUpdated = now;
        console.log('[Stock Catalog] 종목 카탈로그 갱신 완료');
      } finally {
        // 갱신 완료 후 Promise 초기화
        refreshPromise = null;
      }
    })();
    
    return refreshPromise;
  }
}

/**
 * 주식 카탈로그를 가져옵니다 (필요시 자동 갱신)
 */
export async function getStockCatalog(): Promise<Record<string, string>> {
  await refreshStockCatalog();
  return STOCK_CODE_MAP;
}

/**
 * 동기적으로 주식 카탈로그를 가져옵니다 (이미 로드된 경우)
 */
export function getStockCatalogSync(): Record<string, string> {
  return STOCK_CODE_MAP;
}

/**
 * 종목명으로 종목코드를 찾습니다
 */
export function getStockCodeByName(name: string): string | undefined {
  const catalog = getStockCatalogSync();
  return catalog[name];
}

/**
 * 종목코드로 종목명을 찾습니다
 */
export function getStockNameByCode(code: string): string | undefined {
  const catalog = getStockCatalogSync();
  return Object.keys(catalog).find(key => catalog[key] === code);
}

// ⚠️ 중요: SSR 환경에서의 실행 위치
// 
// 1. 서버 사이드 (Node.js):
//    - 이 모듈 레벨 코드는 서버에서만 실행됩니다
//    - 서버가 시작될 때 한 번만 실행되어 서버 메모리에 STOCK_CODE_MAP 저장
//    - loader 함수에서 사용할 때는 서버의 메모리를 참조
//
// 2. 클라이언트 사이드 (브라우저):
//    - 브라우저에서는 별도의 모듈 인스턴스가 생성됩니다
//    - 클라이언트의 STOCK_CODE_MAP은 비어있습니다 (서버와 별개)
//    - 클라이언트에서 사용하려면 useEffect에서 getStockCatalog()를 호출해야 합니다
//
// 서버 시작 시 주식 카탈로그를 한 번 로드 (서버에서만 실행됨)
let initialized = false;

if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행 (window 객체가 없음)
  if (!initialized) {
    console.log('[Stock Catalog] 서버 시작 시 초기화 시작...');
    initialized = true;
    // 비동기 초기화를 백그라운드에서 실행 (서버 시작을 블로킹하지 않음)
    refreshStockCatalog().catch((error) => {
      console.error('[Stock Catalog] 서버 시작 시 초기화 실패:', error);
    });
  }
}

// TypeScript 모듈 인식을 위한 명시적 export
export type { };
