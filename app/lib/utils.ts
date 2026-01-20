import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
/**
 * 한국 주식 시장이 현재 열려있는지 확인합니다
 */
export function isMarketOpen(): boolean {
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