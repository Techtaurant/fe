# Techtaurant

다양한 기술 블로그의 최신 포스트를 한곳에서 확인할 수 있는 플랫폼입니다.

## 기술 스택

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Montserrat** (Google Fonts)

## 프로젝트 구조

```
app/
├── components/
│   ├── Header.tsx           # 헤더 컴포넌트
│   ├── Filter.tsx           # 필터 사이드바
│   ├── PostCard.tsx         # 게시물 카드
│   └── SelectDialog.tsx     # 검색 다이얼로그
├── types/
│   └── index.ts            # 타입 정의
├── page.tsx                # 메인 페이지
├── layout.tsx              # 루트 레이아웃
└── globals.css             # 디자인 시스템

prd/
├── design-system.json      # 디자인 시스템 정의
└── techtaurant-logo.png    # 로고 이미지
```

## 컴포넌트 아키텍처

### Header (`app/components/Header.tsx`)

**위치**: 상단 고정 헤더
**역할**: 로고, 검색, 사용자 인증 UI 제공

**주요 기능**:
- Techtaurant 로고 (Montserrat Bold, 클릭 시 홈 이동)
- 검색창 (Medium 스타일)
- 마이페이지/로그인 버튼 (로그인 상태에 따라 변경)

**Props**: 없음 (자체 상태 관리)

---

### Filter (`app/components/Filter.tsx`)

**위치**: 좌측 사이드바 (고정, 280px)
**역할**: 게시물 필터링 및 정렬 옵션 제공

**Props**:
```typescript
interface FilterProps {
  filterState: FilterState;
  onFilterChange: (newState: FilterState) => void;
  availableTags: Tag[];
  availableTechBlogs: TechBlog[];
}
```

**주요 기능**:
- 정렬 옵션 (최신순/인기순)
- 읽은 게시물 제외 토글
- 태그 필터 (최대 5개 노출, 더보기 버튼)
- 기술 블로그 필터 (최대 5개 노출, 더보기 버튼)
- SelectDialog 통합

**동작**:
1. 최대 5개 항목만 표시
2. 더보기 버튼 클릭 시 SelectDialog 오픈
3. 선택된 항목은 체크박스로 표시

---

### PostCard (`app/components/PostCard.tsx`)

**위치**: 메인 컨텐츠 영역
**역할**: 개별 게시물 정보 표시

**Props**:
```typescript
interface PostCardProps {
  post: Post;
  onReadStatusChange?: (postId: string, isRead: boolean) => void;
}
```

**표시 정보**:
- 테크 블로그 아이콘 + 이름
- 게시물 제목
- 썸네일 이미지 (선택적)
- 조회수 (포맷팅: 천/만 단위)
- 태그 목록
- 읽음 표시 뱃지

**동작**:
- 카드 클릭 시 새 탭에서 게시물 열기
- 클릭 시 읽음 상태로 자동 변경
- 호버 시 배경색 변경

---

### SelectDialog (`app/components/SelectDialog.tsx`)

**위치**: Modal (z-index: 500)
**역할**: 검색 가능한 다중 선택 다이얼로그

**Props**:
```typescript
interface SelectDialogProps<T extends SelectDialogItem> {
  isOpen: boolean;
  onClose: () => void;
  items: T[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  title: string;
  searchPlaceholder?: string;
}
```

**주요 기능**:
- 실시간 검색 필터링
- 다중 선택 (체크박스)
- 선택된 항목 카운트 표시
- ESC 키로 닫기
- 백드롭 클릭으로 닫기
- body 스크롤 잠금

**디자인**:
- 최대 너비: 480px
- 최대 높이: 640px
- 배경: 반투명 검정색 백드롭
- 그림자: lg

---

### 메인 페이지 (`app/page.tsx`)

**역할**: 전체 레이아웃 및 상태 관리

**구조**:
```typescript
<Header />
<div className="flex">
  <Filter />
  <main>
    <PostCard />
    <PostCard />
    ...
  </main>
</div>
```

**상태 관리**:
- `filterState`: 필터 상태 (정렬, 읽은 게시물 제외, 선택된 태그/블로그)
- `posts`: 게시물 목록

**로직**:
1. **필터링**: 읽은 게시물 제외, 태그/기술블로그 필터
2. **정렬**: 최신순 (publishedAt), 인기순 (viewCount)
3. **읽음 처리**: PostCard 클릭 시 상태 업데이트

---

## 타입 정의 (`app/types/index.ts`)

### Tag
```typescript
interface Tag {
  id: string;
  name: string;
}
```

### TechBlog
```typescript
interface TechBlog {
  id: string;
  name: string;
  iconUrl: string;
}
```

### Post
```typescript
interface Post {
  id: string;
  title: string;
  thumbnailUrl?: string;
  viewCount: number;
  tags: Tag[];
  techBlog: TechBlog;
  isRead: boolean;
  publishedAt: string;
  url: string;
}
```

### FilterState
```typescript
interface FilterState {
  sortBy: 'latest' | 'popular';
  hideReadPosts: boolean;
  selectedTags: string[];
  selectedTechBlogs: string[];
}
```

---

## 디자인 시스템

**기반**: Medium 스타일 인터페이스 (`prd/design-system.json`)

### 색상 팔레트
- **Primary**: Black (#000000), White (#FFFFFF)
- **Accent**: Gold (#FFC017), Green (#03A87C)
- **Gray Scale**: 50-800 (9단계)

### 타이포그래피
- **Serif**: Charter (컨텐츠용)
- **Sans-Serif**: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto (UI용)
- **Logo**: Montserrat Bold (브랜드용)

### 스페이싱
- **Base Unit**: 8px
- **Scale**: 8px, 12px, 16px, 24px, 32px, 48px, 64px, 80px

### Border Radius
- **sm**: 4px (뱃지, 태그)
- **md**: 8px (카드, 버튼)
- **pill**: 24px (검색창, 주요 버튼)
- **full**: 9999px (아이콘 버튼, 아바타)

### Z-Index
- **Base**: 0
- **Dropdown**: 100
- **Sticky**: 200
- **Fixed**: 300 (Header)
- **Modal Backdrop**: 400
- **Modal**: 500 (SelectDialog)

---

## 실행 방법

### 개발 서버
```bash
npm install
npm run dev
```

### 빌드
```bash
npm run build
```

### 프로덕션 실행
```bash
npm start
```

---

## 주요 기능

### 1. 필터링
- **태그 필터**: 다중 선택 가능, 검색 지원
- **기술 블로그 필터**: 다중 선택 가능, 검색 지원
- **읽은 게시물 제외**: 토글 방식

### 2. 정렬
- **최신순**: 발행일 기준 내림차순
- **인기순**: 조회수 기준 내림차순

### 3. 게시물 카드
- 클릭 시 새 탭에서 열기
- 자동 읽음 처리
- 조회수 포맷팅 (천/만 단위)

### 4. 검색 다이얼로그
- 실시간 검색
- 다중 선택
- 키보드 접근성 (ESC 키)

---

## 개발 원칙

### KISS (Keep It Simple, Stupid)
- 함수는 한 가지 일만 수행
- 함수 길이 50줄 이하 유지
- 자기 설명적 코드 작성

### YAGNI (You Aren't Gonna Need It)
- 명시적으로 요구된 기능만 구현
- 3번 반복 시 추상화 고려

---

## TODO

- [ ] 실제 API 연동
- [ ] 로그인/인증 구현
- [ ] 검색 기능 구현
- [ ] 무한 스크롤/페이지네이션
- [ ] 반응형 레이아웃 (모바일, 태블릿)
