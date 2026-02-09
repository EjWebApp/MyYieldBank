# Welcome to React Router!

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