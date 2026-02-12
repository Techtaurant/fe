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
- 정렬 옵션 (최신순)
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

## 스크립트 정보

### `scripts/installer-macos.sh`

**역할**: macOS에서 자동으로 mkcert를 설치하고 SSL 인증서를 생성하는 보조 스크립트

**동작**:
1. mkcert 설치 여부 확인
2. 없으면 Homebrew로 자동 설치
3. 로컬 CA 등록
4. SSL 인증서 생성 (`conf/ssl/server.key`, `conf/ssl/server.crt`)

**현재 프로젝트에서는 사용하지 않습니다.**
- 대신 직접 `mkcert localhost 127.0.0.1` 명령어 사용
- 인증서는 프로젝트 루트에 생성 (`localhost+1.pem`, `localhost+1-key.pem`)

---

## 실행 방법

### 개발 서버 (HTTP)
```bash
pnpm install
pnpm dev
```

### 개발 서버 (HTTPS)

OAuth 2.0 테스트 시 HTTPS가 필요합니다.

#### 1. 로컬 SSL 인증서 생성 (처음 1회만)
```bash
mkcert localhost 127.0.0.1
```

생성 파일:
- `localhost+1.pem` (인증서)
- `localhost+1-key.pem` (개인 키)

#### 2. HTTPS 개발 서버 실행
```bash
pnpm dev:https
```

접속: `https://localhost:3000`

> ⚠️ 자체 서명 인증서이므로 브라우저에서 보안 경고가 나타날 수 있습니다. 무시하고 진행하면 됩니다.

### 빌드
```bash
pnpm build
```

### 프로덕션 실행
```bash
pnpm start
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

---

## API 통신 설정

### 개요

이 프로젝트는 프론트엔드(`localhost:3000`)와 백엔드(`localhost:8080`)가 분리된 구조입니다.
API 통신을 위한 두 가지 방식을 지원합니다:

1. **직접 백엔드 서버 연결** (현재 구현) - CORS 설정 필요
2. **Next.js Proxy 사용** (대안) - CORS 설정 불필요

---

### 방식 1: 직접 백엔드 서버 연결 (현재 구현)

#### 특징

- 브라우저에서 백엔드 서버(`http://localhost:3000`)로 직접 요청
- 백엔드에 CORS 설정 필수
- 브라우저 개발자 도구에서 실제 백엔드 URL 확인 가능 (디버깅 용이)
- `httpClient.ts`가 절대 경로로 요청

#### 환경 설정

**.env.local**:
```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
```

#### 백엔드 CORS 설정 (필수)

##### Spring Boot

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)  // 쿠키 전송 허용 (중요!)
                .maxAge(3600);
    }
}
```

##### Node.js (Express)

```javascript
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,  // 쿠키 허용 (중요!)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### 중요 설정

1. **allowCredentials: true** - 쿠키 포함 요청 허용 (필수)
2. **allowedOrigins** - 프론트엔드 URL 정확히 지정 (`http://localhost:3000`)
3. **주의**: `allowCredentials(true)`와 `allowedOrigins("*")`는 함께 사용 불가

#### 테스트 방법

```javascript
// 브라우저 콘솔 (F12)
fetch('http://localhost:3000/api/users/me', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log('✅ CORS 성공:', data))
  .catch(err => console.error('❌ CORS 에러:', err));
```

Response Headers 확인:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
```

#### 트러블슈팅

**CORS policy 에러**:
```
Access to fetch at 'http://localhost:3000/api/users/me' from origin 
'http://localhost:3000' has been blocked by CORS policy
```

해결:
1. 백엔드 CORS 설정 확인
2. `allowedOrigins`에 `http://localhost:3000` 포함 확인
3. `allowCredentials(true)` 설정 확인

**Preflight 요청 실패** (OPTIONS 403):
- OPTIONS 메서드를 `allowedMethods`에 추가
- Spring Security 사용 시 OPTIONS 요청 허용

**쿠키가 전송되지 않음**:
1. 프론트엔드: `credentials: 'include'` 확인
2. 백엔드: `allowCredentials(true)` 확인
3. `allowedOrigins("*")`를 구체적인 URL로 변경

---

### 방식 2: Next.js Proxy 사용 (대안)

#### 특징

- Next.js 개발 서버가 백엔드로 요청을 프록시
- 백엔드 CORS 설정 불필요 (Same-Origin으로 인식)
- 브라우저에는 `localhost:3000`으로 표시 (실제로는 백그라운드에서 `localhost:8080`으로 프록시)

#### 설정 방법

**next.config.ts**:
```typescript
const nextConfig: NextConfig = {
  async rewrites() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiBaseUrl}/api/:path*`,
      },
      {
        source: "/open-api/:path*",
        destination: `${apiBaseUrl}/open-api/:path*`,
      },
    ];
  },
};
```

**httpClient.ts 수정** (프록시 사용 시):
```typescript
// AS-IS (직접 연결)
const fullUrl = `${API_BASE_URL}${url}`;  // http://localhost:3000/api/...

// TO-BE (프록시 사용)
const fullUrl = url;  // /api/... (상대 경로)
```

#### 동작 원리

```
1. 브라우저 (localhost:3000)
   ↓ fetch('/api/users/me')
   
2. Next.js 개발 서버 (localhost:3000)
   ↓ rewrites 규칙 적용
   
3. 백엔드 서버 (localhost:8080)
   ↓ 요청 처리
   
4. Next.js 개발 서버 (localhost:3000)
   ↓ 응답 프록시
   
5. 브라우저에 응답 전달
```

**중요**: 브라우저 개발자 도구에서는 `localhost:3000/api/users/me`로 표시되지만,
실제로는 Next.js 서버가 백그라운드에서 `localhost:8080/api/users/me`로 프록시합니다.

#### 테스트 방법

1. **개발 서버 재시작** (필수):
```bash
npm run dev
```

2. **브라우저 콘솔에서 확인**:
```javascript
fetch('/api/users/me', {
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => console.log('응답:', data))
  .catch(err => console.error('에러:', err));
```

3. **백엔드 서버 로그 확인**:
```
GET /api/users/me 200 OK
```
로그가 표시되면 프록시가 정상 동작하는 것입니다.

#### 올바른 요청 방식

✅ **올바른 방식** (Next.js 프록시 사용):
```typescript
// 상대 경로로 요청
const response = await fetch('/api/users/me', {
  credentials: 'include'
});
```

❌ **잘못된 방식** (직접 백엔드 호출):
```typescript
// CORS 에러 발생!
const response = await fetch('http://localhost:3000/api/users/me', {
  credentials: 'include'
});
```

---

### 두 방식 비교

| 항목 | 직접 연결 (현재) | Proxy (대안) |
|------|-----------------|--------------|
| **CORS 설정** | 백엔드에 필수 | 불필요 |
| **설정 위치** | 백엔드 | 프론트엔드 (next.config.ts) |
| **디버깅** | 쉬움 (실제 URL 표시) | 어려움 (프록시 URL 표시) |
| **개발 서버** | 재시작 불필요 | 설정 변경 시 재시작 필수 |
| **프로덕션** | 별도 CORS 설정 | 별도 프록시 설정 필요 |
| **보안** | CORS 정책 관리 | Next.js 서버 의존 |

**권장사항**:
- 개발 환경: **직접 연결** (현재 구현) - 디버깅 용이
- 프로덕션: 도메인이 같으면 **직접 연결**, 다르면 **CORS 설정** 또는 **API Gateway** 사용

---

## 인증 시스템

### HTTP 클라이언트 (`app/utils/httpClient.ts`)

**역할**: API 요청 및 자동 토큰 갱신 처리
**위치**: `app/utils/httpClient.ts`

#### 주요 기능

1. **직접 백엔드 서버 연결**
   - 백엔드 서버(`localhost:8080`)로 직접 요청
   - `NEXT_PUBLIC_API_BASE_URL` 환경 변수 사용
   - 브라우저 개발자 도구에서 `http://localhost:3000`으로 표시

2. **자동 토큰 갱신**
   - 401 에러 발생 시 응답 body의 Custom Status 확인
   - Custom Status가 3003 (AccessToken 만료)일 때만 토큰 갱신 시도
   - 3008 (인증 필요) 등 다른 에러는 토큰 갱신하지 않고 바로 반환
   - refreshToken은 쿠키에 자동 포함 (credentials: 'include')
   - 갱신 성공 시 원래 요청 자동 재시도

3. **중복 갱신 방지**
   - 토큰 갱신 중 플래그(`isRefreshing`)로 중복 방지
   - 갱신 중인 다른 요청들은 대기 큐에 추가
   - 갱신 완료 후 대기 중인 요청들 자동 실행

4. **에러 처리**
   - 갱신 실패 시 홈으로 리다이렉트
   - 대기 중인 모든 요청에 에러 전파

#### API 함수

```typescript
// 기본 HTTP 클라이언트 (자동 토큰 갱신 포함)
httpClient(url: string, options?: RequestInit): Promise<Response>

// 편의 함수들
httpGet<T>(url: string): Promise<T>
httpPost<T>(url: string, data?: unknown): Promise<T>
httpPut<T>(url: string, data?: unknown): Promise<T>
httpDelete<T>(url: string): Promise<T>

// 토큰 갱신 함수
refreshTokens(): Promise<boolean>
```

#### 사용 예시

```typescript
import { httpClient, httpGet } from '@/app/utils/httpClient';

// 기본 사용 (상대 경로만 전달)
const response = await httpClient('/api/users/me');
// 실제 요청: http://localhost:3000/api/users/me

// 편의 함수 사용
const user = await httpGet<User>('/api/users/me');
```

#### 동작 흐름

1. **정상 요청**
   ```
   Client → http://localhost:3000/api/users/me → 200 OK → Response
   ```

2. **토큰 만료 시 (Custom Status 3003)**
   ```
   Client → http://localhost:3000/api/users/me → 401 (status: 3003)
         ↓
   Check Custom Status (3003 확인)
         ↓
   Refresh API (http://localhost:3000/open-api/auth/refresh)
         ↓
   Success → Retry Original Request → Response
   ```

3. **인증 필요 (Custom Status 3008)**
   ```
   Client → http://localhost:3000/api/users/me → 401 (status: 3008)
         ↓
   Check Custom Status (3008 확인)
         ↓
   Return Response (토큰 갱신하지 않음)
   ```

4. **토큰 갱신 실패 시**
   ```
   Client → http://localhost:3000/api/users/me → 401 (status: 3003)
         ↓
   Refresh API → Failed
         ↓
   Redirect to /
   ```

#### RefreshToken 저장 방식

- **저장 위치**: HttpOnly Cookie (보안)
- **자동 전송**: `credentials: 'include'` 옵션으로 자동 포함
- **JavaScript 접근 불가**: XSS 공격으로부터 안전

---

### OAuth 2.0 설정

**주의**: 프론트엔드는 **HTTPS**에서만 작동합니다.
- 로컬 개발: `pnpm dev:https`로 `https://localhost:3000`에서 실행
- 쿠키가 `Secure; SameSite=None` 설정되므로 HTTPS 필수

**동작 흐름**:
1. 로그인 버튼 클릭
2. 브라우저가 백엔드 OAuth URL로 리다이렉트
3. 백엔드가 쿠키 설정 (같은 도메인에)
4. Google OAuth 콜백 후 쿠키 자동 전달

---

### useUser 훅 (`app/hooks/useUser.ts`)

**역할**: 현재 로그인한 사용자 정보 조회

#### 특징

- httpClient 사용으로 자동 토큰 갱신 지원
- 401 에러 시 자동으로 토큰 갱신 후 재시도

#### 반환값

```typescript
interface UseUserResult {
  user: User | null;          // 사용자 정보
  isLoading: boolean;         // 로딩 상태
  error: Error | null;        // 에러
  refetch: () => void;        // 재조회 함수
}
```

---

### 인증 API 엔드포인트

#### POST /open-api/auth/refresh

**역할**: Access Token 및 Refresh Token 갱신

**요청**:
- Method: POST
- Headers: refreshToken (쿠키에서 자동 전송)

**응답**:
```typescript
{
  status: 0,           // 0: 성공, 기타: 실패
  message: string      // 응답 메시지
}
```

**성공 시**: 새로운 토큰이 쿠키에 자동 설정됨

---

### 에러 코드

#### HTTP Status Code

| Code | 설명 | 처리 |
|------|------|------|
| 200 | 성공 | 정상 처리 |
| 401 | Unauthorized | Custom Status 확인 후 처리 |
| 기타 | 서버 에러 | 에러 반환 |

#### Custom Status Code

| Code | 설명 | 처리 |
|------|------|------|
| 0 | 성공 | 정상 처리 |
| 3003 | AccessToken 만료 | 자동 토큰 갱신 시도 |
| 3008 | 인증 필요 | 에러 반환 (갱신하지 않음) |
| 기타 | 토큰 갱신 실패 | 홈으로 리다이렉트 |

---

## Type Coverage

### 개요

TypeScript의 타입 커버리지를 측정하고 관리하는 시스템입니다.
`any` 타입 사용을 추적하여 타입 안정성을 보장합니다.

**목표**: 95% 이상의 타입 커버리지 유지

**파일 구조**:
- `.type-coverage/current.json`: 현재 type coverage 결과
- `.type-coverage/previous.json`: 이전 실행의 coverage 결과 (비교용)
- `coverage-detail.txt`: any 타입 사용 위치 상세 정보 (임시 파일)
- `coverage-comment.md`: PR 코멘트용 리포트 (임시 파일)

---

### GitHub Actions Workflow

**파일**: `.github/workflows/type-coverage.yml`

#### 실행 시점

- PR이 `main` 브랜치로 열리거나 업데이트될 때

#### 주요 기능

1. **Base 브랜치 Coverage 측정**
   - PR의 base 브랜치(main)로 체크아웃
   - 타입 커버리지 측정 및 저장

2. **PR Coverage 측정**
   - PR 브랜치의 타입 커버리지 측정

3. **비교 리포트 생성**
   - Base와 PR의 coverage 비교
   - `any` 타입 사용 위치 추적
   - 상세 리포트 자동 생성

4. **PR 코멘트 작성**
   - Coverage 비교 결과를 PR에 코멘트로 작성
   - 기존 코멘트가 있으면 업데이트

5. **Coverage 검증**
   - 95% 미만 시 워크플로우 실패
   - PR 머지 차단

#### 필요한 권한

```yaml
permissions:
  contents: read        # 코드 체크아웃
  pull-requests: write  # PR 코멘트 작성
```

---

### PR 코멘트 형식

워크플로우가 생성하는 PR 코멘트 예시:

```markdown
## 📊 Type Coverage Report

✅ Type coverage가 기준을 충족합니다!

### Coverage Summary

| Metric | Value |
|--------|-------|
| **Current Coverage** | **96.50%** |
| Base Coverage | 95.20% |
| Change | 🟢 📈 +1.30% |
| Threshold | 95% |

### Type Statistics

- **Total Symbols**: 1,234
- **Correctly Typed**: 1,191
- **Any Types**: 43

### 🔍 Files with `any` Types (3 files)

<details>
<summary><code>app/utils/api.ts</code> (5 occurrences)</summary>

```
Line 12:5 - implicit any
Line 24:10 - implicit any
Line 45:3 - parameter 'data' implicitly has an 'any' type
...
```

</details>
```

---

### 로컬 실행 방법

#### 1. 전체 Coverage 확인

```bash
npm run type-coverage
```

**출력 예시**:
```
(1525 / 1531) 99.60%
type-coverage success.
```

#### 2. JSON 형식 출력

```bash
npm run type-coverage:json
```

**출력 파일**: `.type-coverage/current.json`

```json
{
  "succeeded": true,
  "atLeastFailed": false,
  "correctCount": 1525,
  "percent": 99.6,
  "percentString": "99.60",
  "totalCount": 1531
}
```

실행 시 이전 coverage 데이터(`.type-coverage/previous.json`)가 있으면 자동으로 비교하여 변경사항을 추적합니다.

#### 3. 상세 정보 확인 (any 위치 추적)

```bash
npm run type-coverage:detail
```

**출력 예시**:
```
/path/to/app/utils/httpClient.ts:106:11: body
/path/to/app/utils/httpClient.ts:108:9: body
/path/to/app/hooks/useUser.ts:37:13: result
(1525 / 1531) 99.60%
type-coverage success.
```

#### 4. 전체 리포트 생성 (로컬 테스트용)

```bash
npm run type-coverage:report
```

**기능**:
- Coverage 측정
- 상세 정보 수집
- PR 코멘트 형식으로 리포트 생성
- 콘솔에 출력

**출력 예시**:
```markdown
## 📊 Type Coverage Report

✅ Type coverage가 기준을 충족합니다!

### Coverage Summary

| Metric | Value |
|--------|-------|
| **Current Coverage** | **99.60%** |
| Base Coverage | 95.00% |
| Change | 🟢 📈 +4.60% |
| Threshold | 95% |

### 📊 Changes from Previous Run

| Metric | Previous | Current | Change |
|--------|----------|---------|--------|
| Coverage | 99.50% | 99.60% | 📈 +0.10% |
| Total Symbols | 1,520 | 1,531 | +11 |
| Any Types | 8 | 6 | 🟢 -2 |

✨ **Great job!** `any` 타입이 2개 줄었습니다!

### 🔍 Files with `any` Types (2 files)

...
```

> 💡 **이전 실행 데이터 비교**: `.type-coverage/previous.json` 파일이 있으면 자동으로 이전 실행과 비교하여 개선/악화 내역을 표시합니다.

---

### Coverage Report 생성 스크립트

**파일**: `.github/scripts/generate-coverage-report.js`

#### 역할

- `.type-coverage/current.json` 파싱
- Base와 PR coverage 비교
- 이전 실행과 현재 실행 비교 (`.type-coverage/previous.json`)
- `any` 사용 위치 분석
- PR 코멘트용 마크다운 생성

#### 입력

- `.type-coverage/current.json`: 현재 type coverage 결과
- `.type-coverage/previous.json`: 이전 coverage 결과 (선택적)
- `coverage-detail.txt`: `any` 타입 상세 위치
- `BASE_COVERAGE` (환경 변수): Base 브랜치의 coverage

#### 출력

- `coverage-comment.md`: PR 코멘트용 마크다운 파일
- `.type-coverage/previous.json`: 다음 비교를 위해 현재 결과 저장

#### 주요 함수

```javascript
// any 사용 정보 파싱
parseAnyUsages(detailText: string): Record<string, AnyUsage[]>

// 이전 coverage와 비교 분석
analyzeChanges(previous, current, currentAnyUsages): ChangeAnalysis

// PR 코멘트용 마크다운 생성
generateMarkdown(options): string
```

#### 변경사항 추적

스크립트는 실행 시 다음 작업을 수행합니다:
1. `.type-coverage/previous.json`이 있으면 읽어서 비교 분석
2. 현재 결과를 `.type-coverage/current.json`에 저장
3. 다음 비교를 위해 `current.json`을 `previous.json`으로 복사
4. Coverage 증감, any 타입 개수 변화 등을 리포트에 포함

---

### 트러블슈팅

#### Coverage가 95% 미만일 때

**증상**: PR이 머지되지 않음

**해결**:
1. `npm run type-coverage:detail` 실행
2. `any` 타입 사용 위치 확인
3. 명시적 타입 정의 추가

**예시**:
```typescript
// ❌ Before (any 타입)
function getData(id) {
  return fetch(`/api/data/${id}`);
}

// ✅ After (명시적 타입)
function getData(id: string): Promise<Response> {
  return fetch(`/api/data/${id}`);
}
```

#### Workflow가 실패할 때

**증상**: GitHub Actions에서 type-coverage 워크플로우 실패

**확인 사항**:
1. `type-coverage` 패키지 설치 확인
2. `tsconfig.json` 존재 확인
3. `bc` 명령어 사용 가능 여부 (Ubuntu에 기본 설치)

---

### any 타입 사용 줄이기 팁

#### 1. 명시적 타입 정의

```typescript
// ❌ Bad
const data: any = await response.json();

// ✅ Good
interface UserData {
  id: string;
  name: string;
}
const data: UserData = await response.json();
```

#### 2. unknown 타입 사용

```typescript
// ❌ Bad
function processData(data: any) {
  return data.value;
}

// ✅ Good
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

#### 3. 제네릭 활용

```typescript
// ❌ Bad
function getItem(arr: any[], index: number): any {
  return arr[index];
}

// ✅ Good
function getItem<T>(arr: T[], index: number): T {
  return arr[index];
}
```

#### 4. 타입 가드 작성

```typescript
// ❌ Bad
function isUser(obj: any): boolean {
  return obj.name !== undefined;
}

// ✅ Good
interface User {
  name: string;
  email: string;
}

function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'email' in obj
  );
}
```

---

### 설정 파일

#### package.json 스크립트

```json
{
  "scripts": {
    "type-coverage": "type-coverage",
    "type-coverage:json": "mkdir -p .type-coverage && type-coverage --json-output > .type-coverage/current.json",
    "type-coverage:detail": "type-coverage --detail",
    "type-coverage:report": "npm run type-coverage:json && type-coverage --detail 2>&1 > coverage-detail.txt && BASE_COVERAGE=95.00 node .github/scripts/generate-coverage-report.js && cat coverage-comment.md"
  }
}
```

**스크립트 설명**:
- `type-coverage`: 간단한 coverage 확인
- `type-coverage:json`: `.type-coverage` 디렉토리 생성 후 JSON 형식으로 결과 저장
- `type-coverage:detail`: any 타입 상세 위치 출력
- `type-coverage:report`: 전체 PR 코멘트 형식 리포트 생성 (로컬 테스트용, 이전 실행과 자동 비교)

#### GitHub Actions 주요 설정

**Node.js 버전**: 20
**실행 환경**: ubuntu-latest
**Coverage 임계값**: 95%

---

### 참고 자료

- [type-coverage GitHub](https://github.com/plantain-00/type-coverage)
- [TypeScript Handbook - Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
