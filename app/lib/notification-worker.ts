import { makeSSRClient } from "~/supa-client";
import { getStockPrice } from "~/lib/stock-api";
import { Resend } from "resend";

const resendClient = new Resend(process.env.RESEND_API_KEY);

/**
 * Cron에서 호출하는 진입점.
 * 익절/손절 조건을 체크하고, 조건 만족 시 알림 발송. 발송 주기는 cron 스케줄로 제어.
 * 사용 예: Vercel Cron, GitHub Actions, 외부 cron에서 GET /api/cron/stock-notifications 호출
 */
export async function runStockNotificationCheck(): Promise<void> {
  await checkAndSendStockNotifications();
}

/**
 * 익절/손절 조건 도달 시 알림 발송
 */
async function checkAndSendStockNotifications() {
  console.log('[NotificationWorker] 주식 알림 체크 시작...');
  
  try {
    // 모든 사용자의 프로필 ID 가져오기
    // Supabase 클라이언트 생성 (서버 사이드)
    const dummyRequest = new Request('http://localhost');
    const { client } = makeSSRClient(dummyRequest);
    console.log('[NotificationWorker] Supabase 클라이언트 생성 완료');
    
    // 모든 프로필 가져오기
    const { data: profilesData, error: profilesError } = await client
      .from('profiles')
      .select('profile_id, name');
    
    if (profilesError) {
      console.error('[NotificationWorker] 프로필 조회 실패:', profilesError);
      return;
    }
    
    const profiles = (profilesData ?? []) as { profile_id: string; name: string }[];
    if (profiles.length === 0) {
      console.log('[NotificationWorker] 프로필이 없습니다.');
      return;
    }
    
    console.log(`[NotificationWorker] ${profiles.length}개 프로필 확인:`, profiles.map(p => ({ id: p.profile_id, name: p.name })));
    
    // 각 프로필별로 주식 보유량 확인
    for (const profile of profiles) {
      try {
        console.log(`[NotificationWorker] 프로필 ${profile.name} (${profile.profile_id}) 처리 시작`);
        await checkProfileStockNotifications(client, profile.profile_id, profile.name);
        console.log(`[NotificationWorker] 프로필 ${profile.name} (${profile.profile_id}) 처리 완료`);
      } catch (error) {
        console.error(`[NotificationWorker] 프로필 ${profile.profile_id} 처리 실패:`, error);
        // 개별 프로필 에러는 무시하고 계속 진행
      }
    }
    
    console.log('[NotificationWorker] 주식 알림 체크 완료');
  } catch (error) {
    console.error('[NotificationWorker] 전체 에러:', error);
  }
}

/**
 * 특정 프로필의 주식 알림 체크 및 발송
 */
async function checkProfileStockNotifications(
  client: any,
  profileId: string,
  userName: string
) {
  // 해당 프로필의 주식 보유량 가져오기
  const { data: holdings, error: holdingsError } = await client
    .from('stock_holdings')
    .select('*')
    .eq('profile_id', profileId)
    .eq('notification_enabled', true);
  
  if (holdingsError) {
    console.error(`[NotificationWorker] 프로필 ${profileId} 주식 조회 실패:`, holdingsError);
    return;
  }
  
  if (!holdings || holdings.length === 0) {
    console.log(`[NotificationWorker] 프로필 ${profileId}의 활성화된 주식이 없습니다.`);
    return;
  }
  
  console.log(`[NotificationWorker] 프로필 ${profileId}의 주식 ${holdings.length}개 확인`);
  
  // 각 주식의 현재 가격 조회 및 조건 체크
  for (const holding of holdings) {
    if (!holding.notification_enabled) {
      console.log(`[NotificationWorker] 종목 ${holding.name} (${holding.symbol})는 알림 비활성화 상태 - 스킵`);
      continue; // 활성화 상태가 아니면 알림을 보내지 않는다.
    }
    try {
      if (!holding.symbol) {
        console.log(`[NotificationWorker] 종목 ${holding.name}의 symbol이 없음 - 스킵`);
        continue;
      }
      
      console.log(`[NotificationWorker] 종목 ${holding.name} (${holding.symbol}) 가격 조회 시작`);
      
      // 현재 가격 조회
      const priceInfo = await getStockPrice(holding.symbol);
      const currentPrice = priceInfo.currentPrice || holding.current_price || 0;
      const purchasePrice = holding.purchase_price || 0;
      
      console.log(`[NotificationWorker] 종목 ${holding.name}: 현재가=${currentPrice}, 매수가=${purchasePrice}`);
      
      if (purchasePrice === 0) {
        console.log(`[NotificationWorker] 종목 ${holding.name}의 매수가가 0 - 스킵`);
        continue;
      }
      
      // 수익률 계산
      const profitRate = ((currentPrice - purchasePrice) / purchasePrice) * 100;
      const takeProfitRate = parseFloat(holding.take_profit_rate?.toString() || '0');
      const stopLossRate = parseFloat(holding.stop_loss_rate?.toString() || '0');
      
      console.log(`[NotificationWorker] 종목 ${holding.name}: 수익률=${profitRate.toFixed(2)}%, 익절률=${takeProfitRate}%, 손절률=${stopLossRate}%`);
      
      // 익절 조건 체크
      if (takeProfitRate > 0 && profitRate >= takeProfitRate) {
        console.log(`[NotificationWorker] ✅ 익절 조건 도달! ${holding.name}: ${profitRate.toFixed(2)}% >= ${takeProfitRate}%`);
        await sendNotificationIfNeeded(
          client,
          holding.holding_id,
          profileId,
          'take_profit',
          holding.name,
          profitRate,
          takeProfitRate
        );
      } else {
        console.log(`[NotificationWorker] 익절 조건 미도달: ${profitRate.toFixed(2)}% < ${takeProfitRate}%`);
      }
      
      // 손절 조건 체크
      if (stopLossRate < 0 && profitRate <= stopLossRate) {
        console.log(`[NotificationWorker] ⚠️ 손절 조건 도달! ${holding.name}: ${profitRate.toFixed(2)}% <= ${stopLossRate}%`);
        await sendNotificationIfNeeded(
          client,
          holding.holding_id,
          profileId,
          'stop_loss',
          holding.name,
          profitRate,
          stopLossRate
        );
      } else {
        console.log(`[NotificationWorker] 손절 조건 미도달: ${profitRate.toFixed(2)}% > ${stopLossRate}%`);
      }
    } catch (error) {
      console.error(`[NotificationWorker] 종목 ${holding.symbol} 처리 실패:`, error);
      // 개별 종목 에러는 무시하고 계속 진행
    }
  }
}

/**
 * 알림 발송 (cron 스케줄에서 호출 주기 제어)
 */
async function sendNotificationIfNeeded(
  client: any,
  holdingId: number,
  profileId: string,
  notificationType: 'take_profit' | 'stop_loss',
  stockName: string,
  profitRate: number,
  targetRate: number
) {
  console.log(`[NotificationWorker] 알림 발송 시작: ${stockName} (${notificationType}), 프로필: ${profileId}`);
  
  // 사용자 이메일 가져오기 (profiles 테이블에서 조회)
  console.log(`[NotificationWorker] 프로필 ${profileId}의 이메일 조회 시작`);
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('email')
    .eq('profile_id', profileId)
    .single();
  
  if (profileError) {
    console.error(`[NotificationWorker] 프로필 ${profileId} 조회 실패:`, profileError);
    return;
  }
  
  if (!profile) {
    console.error(`[NotificationWorker] 프로필 ${profileId}를 찾을 수 없습니다.`);
    return;
  }
  
  console.log(`[NotificationWorker] 프로필 조회 결과:`, { 
    profile_id: profileId, 
    email: profile.email,
    email_type: typeof profile.email,
    email_length: profile.email?.length 
  });
  
  const emailRaw = profile.email;
  if (!emailRaw) {
    console.warn(`[NotificationWorker] 프로필 ${profileId}의 이메일이 없습니다. (null 또는 빈 문자열)`);
    return;
  }
  
  // 이메일 정리 및 검증
  const email = String(emailRaw).trim();
  console.log(`[NotificationWorker] 이메일 정리 후: "${email}" (길이: ${email.length})`);
  
  // 이메일 형식 검증 (간단한 정규식)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.error(`[NotificationWorker] 유효하지 않은 이메일 형식: "${email}"`);
    return;
  }
  
  console.log(`[NotificationWorker] 이메일 검증 완료: ${email}`);
  
  try {
    const subject = notificationType === 'take_profit' 
      ? `🎉 익절 조건 도달: ${stockName}`
      : `⚠️ 손절 조건 도달: ${stockName}`;
    
    const message = notificationType === 'take_profit'
      ? `${stockName}의 수익률이 ${profitRate.toFixed(2)}%에 도달했습니다. (목표: ${targetRate}%)`
      : `${stockName}의 수익률이 ${profitRate.toFixed(2)}%에 도달했습니다. (한도: ${targetRate}%)`;
    
    console.log(`[NotificationWorker] Resend API 호출 시작:`, {
      from: "admin <admin@mail.moneylab.blog>",
      to: email,
      subject: subject,
    });
    
    const emailResult = await resendClient.emails.send({
      from: "admin <admin@mail.moneylab.blog>",
      to: [email],
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${subject}</h2>
          <p>${message}</p>
          <p>MyYieldBank에서 자세한 정보를 확인하세요.</p>
        </div>
      `,
    });
    
    console.log(`[NotificationWorker] Resend API 응답:`, emailResult);
    
    if (emailResult.error) {
      console.error(`[NotificationWorker] Resend API 에러:`, emailResult.error);
      throw new Error(`Resend API 에러: ${JSON.stringify(emailResult.error)}`);
    }
    
    // 알림 발송 기록 저장
    console.log(`[NotificationWorker] 알림 발송 기록 저장 시작`);
    const insertResult = await client.from('stock_notifications').insert({
      holding_id: holdingId,
      profile_id: profileId,
      notification_type: notificationType,
      sent_at: new Date().toISOString(),
    });
    
    console.log(`[NotificationWorker] 알림 발송 기록 저장 결과:`, insertResult);
    
    console.log(`[NotificationWorker] ✅ ${stockName} ${notificationType} 알림 발송 완료: ${email}`);
  } catch (error) {
    console.error(`[NotificationWorker] ❌ 알림 발송 실패:`, error);
    if (error instanceof Error) {
      console.error(`[NotificationWorker] 에러 메시지:`, error.message);
      console.error(`[NotificationWorker] 에러 스택:`, error.stack);
    }
  }
}
