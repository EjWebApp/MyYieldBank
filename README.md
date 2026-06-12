# Welcome to React Router!

## 프로젝트 기술 스택

- 언어: TypeScript
- 프레임워크: React 19, React Router v7, Vite
- 스타일링: Tailwind CSS v4
- 서버/백엔드: React Router 서버 렌더링, Supabase, Drizzle ORM, PostgreSQL

A modern, production-ready template for building full-stack React applications using React Router.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/remix-run/react-router-templates/tree/main/default)

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
npm run build
```

## Deployment

### Docker Deployment

To build and run using Docker:

```bash
docker build -t my-app .

# Run the container
docker run -p 3000:3000 my-app
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `npm run build`

```
├── package.json
├── package-lock.json (or pnpm-lock.yaml, or bun.lockb)
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever CSS framework you prefer.

---

Built with ❤️ using React Router.


# vite : 코드를 가져다가 다른 걸(JavaScript와 CSS)로 변환해 주는 역할을 함.
# http://tailwindcss.com/

# shadcn
### npx shadcn@latest init
### npx shadcn@latest Button

# supabase 에 데이터 베이스 생성
# Drizzle : ORM, 즉 객체 관계형 매퍼(Object Relational Mapper)
    드리즐을 이용해서 타입스크립트를 쓰면 그걸 드리즐이 SQL로 변환해줌
npm i drizzle-orm postgres
npm i -D drizzle-kit
schema : 데이터베이스 테이블의 정의

데이터베이스 작업 순서
schema.ts 작성 -> npm run db:generate -> npm run db:migrate ->npm run db:studio
npx drizzle-kit push
npm run db:apply 명령으로 직접 SQL을 실행

# 2026-01-27
## 7.1 : Server Side vs Cliden Side Auth
    [Browser]
    Client Cookies ---> Supabase Server ---> Who is the user?
    [Server]
    Browser Send Cookies ---> loader() receives cookies ----> Supabase SSC (cookies) ---> Supabase Server ---> Who is the user?


# 2026-02-09
[ ] 주식 카탈로그(종목코드) 파트
[ ] 서버에서 실행되는 코드와 클라이언트에서 실행 되는 코드 정리
[ ] 한국투자증권 토큰을 서버에서 하루에 한번 요청하도록 관리하고 클라이언트에서는 로더에서 불러오도록 할것

React Router v7 SSR에서 실행 위치 요약:
실행 위치 구분
서버에서만 실행되는 코드
loader 함수: 페이지 로드 시 서버에서 실행
   export async function loader({ request }: Route.LoaderArgs) {     // 서버에서만 실행됨   }
action 함수: 폼 제출 시 서버에서 실행
   export async function action({ request }: Route.ActionArgs) {     // 서버에서만 실행됨   }
모듈 레벨 코드: 파일이 import될 때 실행
   // 파일 최상위 레벨   let STOCK_CODE_MAP = {}; // 서버와 클라이언트 각각 별도로 생성됨
클라이언트에서만 실행되는 코드
React 컴포넌트 함수 본문
   export default function NewStockPage() {     
    // 브라우저에서 실행됨     
    const [name, setName] = useState(""); // 클라이언트에서만 실행   
    }
useEffect, useState 등 훅: 브라우저에서만 실행
이벤트 핸들러: 브라우저에서만 실행
   const handleNameChange = (e) => {     // 브라우저에서만 실행됨   }
현재 문제
stock-catalog.ts의 모듈 레벨 코드:
서버: 서버 시작 시 실행되어 서버 메모리에 STOCK_CODE_MAP 저장
클라이언트: 별도 모듈 인스턴스로 STOCK_CODE_MAP이 비어 있음
해결 방법
클라이언트에서도 카탈로그를 로드해야 합니다. new-stock-page.tsx의 useEffect에서 getStockCatalog()를 호출하도록 이미 추가했습니다.
요약:
서버: loader, action, 모듈 레벨 코드
클라이언트: 컴포넌트 함수, 훅, 이벤트 핸들러
모듈 변수: 서버와 클라이언트가 각각 별도 인스턴스를 가짐
이해가 되셨나요? 추가 질문이 있으면 알려주세요.

# 2026-02-10
[ ] localhost를 임시로 외부에 노출 시키는 프로그램 : 
   WebHook
   https://github.com/cloudflare/cloudflared
   vite.config.ts 파일에 server 설정함
# 2026-02-11
현재 상태
   클라이언트 사이드 브라우저 알림: 구현됨 (home-page.tsx)
   서버 사이드 알림 시스템: 미구현 (이전에 의견만 제시)
   Cloudflare Tunnel 설정: 완료
   
오늘 할 수 있는 작업 제안
1. 서버 사이드 알림 시스템 구현 (우선순위 높음)
   백그라운드 워커로 주기적 체크
   [V]모든 사용자의 주식 보유량 확인
   익절/손절 조건 도달 시 알림 발송 : 02-12
   이메일/카카오톡 연동 준비 : 02-12
2. 알림 발송 이력 관리 (DB 스키마)
   notifications 테이블 생성
   중복 알림 방지 로직
   알림 발송 기록 저장
3. 수익률 대시보드 구현 (기획서 6번)
   일/주/월 수익률 표시
   누적 수익률 시각화
   예금 이자 스타일 UI
4. 은행 리포트 기능 (기획서 7번)
   자주 손절된 종목 TOP
   익절 성공률 통계
   평균 보유 시간 분석
   추천 순서
   서버 사이드 알림 시스템 구현
   알림 발송 이력 DB 스키마 추가
   이메일/카카오톡 발송 로직 연동
   어떤 작업부터 진행할까요?

    npx create-email@latest  
    https://react.email/
    npm install react-email
    npm install @react-email/components

# 2026-02-13
[] 결제 모듈 연동 검토
# 2026-02-15
[] vercel에 배포
npm i @vercel/react-router ->vercel.com

# 2026-02-20
[] vercel(https://my-yield-bank-2qeg5w4xg-maeunjas-projects.vercel.app/auth/login)-www.moneylab.blog 연동오류
[] 구글등으로 로그인 하기
[] UI 모방일 최적화화

#2026-03-03
   [] 네임칩에 새로 가입(https://ap.www.namecheap.com/)n01077074921@gmail.com/n01077074921
      기존 ttochi0115@gmail.com 은 비밀번호 리셋 메일이 오지 않음!!

   ※ Namecheap = 도메인 소유  /  Cloudflare = DNS 연결  /  Vercel = 실제 서버

   [Cloudflare DNS 설정]

   1) 루트 도메인 (@)

   Type: A
   Name: @
   IP: 216.198.79.1(vercel 에서 제공함&기존거에서 수정하거나 삭제하고 할것)
   Proxy: Proxied


   2) www

   Type: CNAME
   Name: www
   Target: cname.vercel-dns.com(Vercel 도메인 등록할 때 알려줌?)
   Proxy: Proxied



   [Vercel 설정]

   Project → Settings → Domains 에 추가:

   moneylab.ink
   www.moneylab.ink



   [주의사항]

   - www → parkingpage.namecheap.com 삭제
   - DNS는 Cloudflare에서만 수정(namecheap에서 제공공)

# 2026-04-10

## Railway
- 이 프로젝트는 **Node**(React Router serve)이므로 `uvicorn main:app` 같은 **Python ASGI 시작 명령을 쓰면 안 됨**. 루트 `railway.json`: 빌드는 Nixpacks, **시작은 `npm run start`**, 헬스체크는 **`GET /health`**.

## Supabase SSR (무효 refresh 토큰 / 로그 노이즈)
- 쿠키만 남고 세션은 서버에 없을 때 `refresh_token_not_found`가 날 수 있음. **`getLoggedInUserId`**: 해당 계열 오류면 **`signOut()` 후 `redirect('/auth/login', { headers })`** 로 응답에 쿠키 제거. **`root` loader**: `data({ user }, { headers })`로 세션 갱신 시 **`Set-Cookie` 누락 방지**.
- **`makeSSRClient(request)`**: `WeakMap`으로 **요청당 SSR 클라이언트 1개**만 쓰게 해 root·loader 간 **중복 리프레시·에러 로그 감소**. 홈 로더는 `getStockHoldings`가 이미 인증하므로 **앞단 중복 인증 제거**; `redirect`는 `catch`에서 **삼키지 않고 재throw**.

# 2026-06-12

vercel 프리 요금제를 사용하기위해 깃허브 설정을 public으로 변경