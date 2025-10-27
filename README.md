# 🏀 HoopLog

농구팀을 효율적으로 관리하는 스마트한 솔루션

## 주요 기능

- 🔐 **Google OAuth 로그인**: 간편하고 안전한 구글 계정 로그인
- 👥 **팀 관리**: 여러 팀 생성 및 참여 지원
- 📊 **역할 시스템**: 매니저/멤버 역할 분담
- 🏆 **티어 시스템**: A/B/C 티어로 선수 실력 관리
- 🔗 **팀 코드**: 간단한 코드로 팀 참여

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Authentication**: Auth.js v5
- **Database**: SQLite (Turso 호환)
- **ORM**: Prisma
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## 환경 설정

1. 환경변수 설정 (`.env.local` 파일 생성):

```env
# Database
DATABASE_URL="file:./dev.db"

# Auth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"

# Google OAuth (Google Cloud Console에서 생성)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

2. Google OAuth 설정:
   - [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
   - OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI: `http://localhost:3000/api/auth/callback/google`

## 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 데이터베이스 초기화:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. 개발 서버 실행:
```bash
npm run dev
```

4. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 데이터베이스 스키마

- **User**: 사용자 정보
- **Team**: 팀 정보 (이름, 코드, 설명)
- **TeamMember**: 팀-사용자 관계 (역할, 티어)
- **Account/Session**: Auth.js 세션 관리

## 사용 방법

1. **로그인**: Google 계정으로 로그인
2. **팀 생성**: 새로운 팀을 만들고 6자리 코드 받기
3. **팀 참여**: 팀 코드로 기존 팀에 참여
4. **팀 관리**: 선택한 팀에서 멤버 관리

## 프로젝트 구조

```
app/
├── api/
│   ├── auth/[...nextauth]/     # Auth.js 라우트
│   └── teams/                  # 팀 관리 API
├── auth/signin/                # 로그인 페이지
├── dashboard/                  # 팀 선택 대시보드
├── team/[id]/                  # 팀 상세 페이지
├── layout.tsx                  # 전역 레이아웃
└── page.tsx                    # 홈페이지

lib/
├── auth.ts                     # Auth.js 설정
├── auth-client.ts              # 클라이언트 Auth 훅
└── prisma.ts                   # Prisma 클라이언트

prisma/
├── schema.prisma               # 데이터베이스 스키마
└── migrations/                 # 마이그레이션 파일
```
