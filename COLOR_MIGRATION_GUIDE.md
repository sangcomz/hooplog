# Color System Migration Guide

## 개요
이 프로젝트는 중앙 집중식 색상 관리 시스템과 다크모드를 지원합니다.

## 색상 시스템 구조

### 1. CSS 변수 (globals.css)
모든 색상은 `globals.css`에 CSS 변수로 정의되어 있습니다.
- 라이트 모드: `:root` 선택자
- 다크 모드: `@media (prefers-color-scheme: dark)` 및 `.dark` 클래스

### 2. Tailwind 클래스
CSS 변수는 Tailwind 클래스로 사용할 수 있습니다:
- `bg-{variable-name}`: 배경색
- `text-{variable-name}`: 텍스트 색
- `border-{variable-name}`: 테두리 색

### 3. 유틸리티 함수 (app/utils/colors.ts)
배지와 상태 표시를 위한 유틸리티 함수를 제공합니다.

## 마이그레이션 방법

### 기존 Tailwind 클래스 → 새 색상 시스템

#### 배경색
```tsx
// Before
className="bg-white"
className="bg-gray-50"
className="bg-gray-100"

// After
className="bg-bg-primary"
className="bg-bg-secondary"
className="bg-bg-tertiary"
```

#### 텍스트 색
```tsx
// Before
className="text-gray-900"
className="text-gray-700"
className="text-gray-600"
className="text-gray-500"
className="text-gray-400"

// After
className="text-text-primary"
className="text-text-secondary"
className="text-text-tertiary"
className="text-text-muted"
```

#### 테두리 색
```tsx
// Before
className="border-gray-200"
className="border-gray-300"

// After
className="border-border-primary"
className="border-border-secondary"
```

#### 상태 색상 (Success/참석)
```tsx
// Before
className="bg-green-100 text-green-800"
className="bg-green-600"
className="text-green-600"

// After
className="bg-success-bg text-success-text"
className="bg-success-solid"
className="text-success-solid"
```

#### 상태 색상 (Error/불참)
```tsx
// Before
className="bg-red-100 text-red-800"
className="bg-red-600"
className="text-red-600"

// After
className="bg-error-bg text-error-text"
className="bg-error-solid"
className="text-error-solid"
```

#### 상태 색상 (Warning/미정)
```tsx
// Before
className="bg-yellow-100 text-yellow-800"
className="bg-yellow-600"
className="text-yellow-600"

// After
className="bg-warning-bg text-warning-text"
className="bg-warning-solid"
className="text-warning-solid"
```

#### Primary 색상 (인디고)
```tsx
// Before
className="bg-indigo-100"
className="bg-indigo-600"
className="text-indigo-600"

// After
className="bg-primary-bg"
className="bg-primary-solid"
className="text-primary-solid"
```

#### Purple 색상 (게스트)
```tsx
// Before
className="bg-purple-300"
className="bg-purple-600"
className="text-purple-700"

// After
className="bg-purple-bg"
className="bg-purple-solid"
className="text-purple-text"
```

### 유틸리티 함수 사용

#### 1. Import 추가
```tsx
import { getTierColor, getRoleColor, getStatusColor, getStatusText } from "@/app/utils/colors"
import { ThemeToggle } from "@/app/components/ThemeToggle"
```

#### 2. 함수 호출 삭제
기존에 컴포넌트 내부에 정의된 `getTierColor`, `getRoleColor` 등의 함수를 삭제합니다.

#### 3. ThemeToggle 추가
헤더 영역에 ThemeToggle 컴포넌트를 추가합니다:
```tsx
<div className="flex items-center space-x-4">
  <ThemeToggle />
  <span className="text-sm text-text-secondary">{session.user?.name}님</span>
  ...
</div>
```

## 완료된 파일
- ✅ `app/globals.css`
- ✅ `app/layout.tsx`
- ✅ `app/components/ThemeProvider.tsx`
- ✅ `app/components/ThemeToggle.tsx`
- ✅ `app/utils/colors.ts`
- ✅ `app/team/[id]/settings/page.tsx`

## 남은 파일
- ⏳ `app/team/[id]/page.tsx`
- ⏳ `app/team/[id]/game/[gameId]/page.tsx`
- ⏳ `app/team/[id]/game/[gameId]/match/page.tsx` (있다면)
- ⏳ `app/dashboard/page.tsx` (있다면)
- ⏳ `app/auth/signin/page.tsx` (있다면)
- ⏳ 기타 페이지들

## 테스트 체크리스트
- [ ] 라이트 모드에서 모든 색상이 올바르게 표시되는지 확인
- [ ] 다크 모드로 전환 시 모든 색상이 올바르게 변경되는지 확인
- [ ] 시스템 설정에 따라 자동으로 테마가 변경되는지 확인
- [ ] 티어 배지 색상이 올바르게 표시되는지 확인
- [ ] 상태 배지 색상이 올바르게 표시되는지 확인
- [ ] 텍스트 가독성이 개선되었는지 확인
