import { useEffect, useRef } from 'react';
import { getBrowserClient } from '~/supa-client';

function playNotificationSound(type: 'take_profit' | 'stop_loss') {
  try {
    const ctx = new AudioContext();
    // 익절: C5→E5→G5 상승 3음 / 손절: G5→E5→C5 하강 3음
    const freqs = type === 'take_profit'
      ? [523, 659, 784]
      : [784, 659, 523];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.value = freq;

      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  } catch {
    // AudioContext 미지원 환경 무시
  }
}

export function useStockNotifications(userId: string | null) {
  const channelRef = useRef<ReturnType<ReturnType<typeof getBrowserClient>['channel']> | null>(null);

  useEffect(() => {
    if (!userId) return;

    // 브라우저 알림 권한 요청
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    const client = getBrowserClient();

    channelRef.current = client
      .channel(`stock-notify-${userId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stock_notifications',
          filter: `profile_id=eq.${userId}`,
        },
        (payload: any) => {
          const row = payload.new as {
            notification_type: 'take_profit' | 'stop_loss';
            stock_name?: string;
            profit_rate?: number;
          };

          const type = row.notification_type;
          const name = row.stock_name ?? '종목';
          const rate = row.profit_rate != null
            ? `${Number(row.profit_rate).toFixed(2)}%`
            : '';

          playNotificationSound(type);

          if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const title = type === 'take_profit'
              ? `🎉 익절 조건 도달: ${name}`
              : `⚠️ 손절 조건 도달: ${name}`;
            const body = rate ? `현재 수익률: ${rate}` : '종목 페이지에서 확인하세요.';

            const notif = new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: `stock-${type}-${Date.now()}`,
            });

            // 알림 클릭 시 /stocks 페이지로 이동
            notif.onclick = () => {
              window.focus();
              window.location.href = '/stocks';
            };
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId]);
}
