# Session Changes - Write Post Feature Implementation

**Branch**: `feat/write-post`
**Date**: 2026-01-31

## Summary
Implementation of the post creation feature with markdown editor and preview functionality. This session added the write post page, updated type definitions, added documentation, and integrated the write post button in the header.

- Changed files: 6
- Total insertions: 137
- Total deletions: 1

## Diff Statistics
```
 .gitignore                 |  2 ++
 .serena/project.yml        | 23 +++++++++++++++++-
 README.md                  | 58 ++++++++++++++++++++++++++++++++++++++++++++++
 app/components/Header.tsx  | 30 ++++++++++++++++++++++++
 app/types/index.ts         | 25 ++++++++++++++++++++
 scripts/installer-macos.sh |  0
 6 files changed, 137 insertions(+), 1 deletion(-)
```

## Key Changes

### 1. New Page: `app/post/write/page.tsx` (Untracked File)
- Full markdown editor with split-view layout (editor on left, preview on right)
- Title, category path, and tags input fields
- Real-time markdown preview
- Tag management (add/remove functionality)
- API integration for post creation
- Responsive design: 2-column on desktop (1024px+), 1-column on mobile

### 2. Type Definitions Updated (`app/types/index.ts`)
```typescript
// 게시물 작성 요청
interface CreatePostRequest {
  title: string;
  content: string;
  categoryPath: string;
  tags: string[];
}

// 게시물 작성 응답
interface CreatePostResponse {
  status: number;
  data: {
    id: string;
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    categoryPath: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}
```

### 3. Header Component Updated (`app/components/Header.tsx`)
- Added "게시물 작성" (Write Post) button for logged-in users
- Button visible on md+ screens, hidden on mobile
- Button styled with secondary color theme
- Icon: plus sign
- Click handler: navigates to `/post/write`
- Added console.warn for OAuth redirect debugging

### 4. Documentation Added (`README.md`)
- New "Pages" section documenting the write post page
- Detailed API specification for POST `/api/posts`
- Response format documentation
- Responsive layout behavior documentation

### 5. Configuration Updates
- Updated `.serena/project.yml` with additional configuration fields (base_modes, default_modes, fixed_tools)
- Updated `.gitignore` to exclude `.claude/` and `.gemini/` directories

### 6. Script Permissions
- `scripts/installer-macos.sh` file mode changed to executable (755)

## API Integration Details

**Endpoint**: `POST /api/posts`

**Request Body**:
```json
{
  "title": "Post Title",
  "content": "Markdown content",
  "categoryPath": "java/spring/deepdive",
  "tags": ["tag1", "tag2"]
}
```

**Success Response (200)**:
```json
{
  "status": 200,
  "data": {
    "id": "uuid",
    "title": "Post Title",
    "content": "Markdown content",
    "authorId": "user-uuid",
    "authorName": "User Name",
    "categoryPath": "java/spring/deepdive",
    "tags": ["tag1", "tag2"],
    "createdAt": "2026-01-31T...",
    "updatedAt": "2026-01-31T..."
  },
  "message": "OK"
}
```

## Input Validation Requirements

- **Title**: Required, non-empty string
- **Category Path**: Required, must follow format (e.g., `java/spring/deepdive`)
- **Content**: Required, markdown format
- **Tags**: Optional, comma or Enter separated

## UI/UX Considerations

- **Responsive Layout**:
  - Desktop (1024px+): 2-column layout with editor and preview side-by-side
  - Tablet/Mobile (<1024px): 1-column layout with editor on top, preview below
  
- **Real-time Preview**:
  - Markdown preview updates as user types
  - Supports code highlighting and Mermaid diagrams
  
- **Tag Management**:
  - Add tags via input field
  - Tags displayed as removable chips
  - Support for Enter and comma as delimiters

## OAuth Debugging
Added console.warn for tracking OAuth redirect:
```typescript
console.warn(
  "Redirecting to OAuth URL:",
  `${apiBaseUrl}/oauth2/authorization/google`,
);
```

## Files Not Yet Created/Implemented
- Actual implementation of `app/post/write/page.tsx` component (structure planned, may need implementation)
- Backend API integration testing
- Error handling for post creation failures

## Next Steps (For Future Sessions)
- [ ] Complete write post page component implementation
- [ ] Add form validation and error messages
- [ ] Implement loading states during API call
- [ ] Add success/failure notifications
- [ ] Test OAuth flow with actual backend
- [ ] Add markdown editor enhancements (toolbar, syntax highlighting)
- [ ] Implement tag autocomplete/suggestions
- [ ] Add draft saving functionality

---

**Full Diff Available Below**

```diff
diff --git a/.gitignore b/.gitignore
index d4c3a83..a380842 100644
--- a/.gitignore
+++ b/.gitignore
@@ -50,3 +50,5 @@ coverage-comment.md.agent
 .gemini
 .github/prompts
 .agent
+.claude/
+.gemini/
diff --git a/.serena/project.yml b/.serena/project.yml
index 298a0ec..d432587 100644
--- a/.serena/project.yml
+++ b/.serena/project.yml
@@ -84,6 +84,27 @@ excluded_tools: []
 # initial prompt for the project. It will always be given to the LLM upon activating the project
 # (contrary to the memories, which are loaded on demand).
 initial_prompt: ""
-
+# the name by which the project can be referenced within Serena
 project_name: "techtaurant-fe"
+
+# list of tools to include that would otherwise be disabled (particularly optional tools that are disabled by default)
 included_optional_tools: []
+
+# list of mode names to that are always to be included in the set of active modes
+# The full set of modes to be activated is base_modes + default_modes.
+# If the setting is undefined, the base_modes from the global configuration (serena_config.yml) apply.
+# Otherwise, this setting overrides the global configuration.
+# Set this to [] to disable base modes for this project.
+# Set this to a list of mode names to always include the respective modes for this project.
+base_modes:
+
+# list of mode names that are to be activated by default.
+# The full set of modes to be activated is base_modes + default_modes.
+# If the setting is undefined, the default_modes from the global configuration (serena_config.yml) apply.
+# Otherwise, this overrides the setting from the global configuration (serena_config.yml).
+# This setting can, in turn, be overridden by CLI parameters (--mode).
+default_modes:
+
+# fixed set of tools to use as the base tool set (if non-empty), replacing Serena's default set of tools.
+# This cannot be combined with non-empty excluded_tools or included_optional_tools.
+fixed_tools: []
diff --git a/README.md b/README.md
index 9f46ce5..9f13a01 100644
--- a/README.md
+++ b/README.md
@@ -341,6 +341,64 @@ pnpm start
 
 ---
 
+## Pages
+
+### 게시물 작성 페이지 (`app/post/write/page.tsx`)
+
+**위치**: `/post/write`
+**역할**: 마크다운 형식의 게시물 작성
+
+**구조**:
+- 좌측: 마크다운 에디터
+- 우측: 실시간 마크다운 프리뷰
+
+**주요 기능**:
+- 제목, 카테고리, 태그 입력
+- 마크다운 에디터 (코드 하이라이팅, Mermaid 다이어그램 지원)
+- 실시간 프리뷰
+- 태그 추가/제거
+- API를 통한 게시물 작성
+
+**입력 필드**:
+- 제목: 게시물의 제목 (필수)
+- 카테고리: `java/spring/deepdive` 형식 (필수)
+- 태그: 쉼표 또는 Enter로 구분 (선택)
+- 내용: 마크다운 형식 (필수)
+
+**API 호출**:
+```typescript
+POST /api/posts
+{
+  "title": "제목",
+  "content": "마크다운 내용",
+  "categoryPath": "카테고리경로",
+  "tags": ["태그1", "태그2"]
+}
+
+Response:
+{
+  "status": 200,
+  "data": {
+    "id": "uuid",
+    "title": "제목",
+    "content": "마크다운 내용",
+    "authorId": "사용자ID",
+    "authorName": "사용자명",
+    "categoryPath": "카테고리경로",
+    "tags": ["태그1", "태그2"],
+    "createdAt": "ISO8601",
+    "updatedAt": "ISO8601"
+  },
+  "message": "OK"
+}
+```
+
+**반응형 레이아웃**:
+- 데스크탑 (1024px 이상): 2열 (에디터 / 프리뷰)
+- 태블릿 이하 (1024px 미만): 1열 (에디터 위 / 프리뷰 아래)
+
+---
+
 ## TODO
 
 - [ ] 실제 API 연동
diff --git a/app/components/Header.tsx b/app/components/Header.tsx
index be5a0d9..1033283 100644
--- a/app/components/Header.tsx
+++ b/app/components/Header.tsx
@@ -58,6 +58,10 @@ export default function Header({
       // 백엔드로 직접 요청 (쿠키가 올바른 도메인에 설정됨)
       const apiBaseUrl =
         process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
+      console.warn(
+        "Redirecting to OAuth URL:",
+        `${apiBaseUrl}/oauth2/authorization/google`,
+      );
       window.location.href = `${apiBaseUrl}/oauth2/authorization/google`;
     } else {
       setIsDropdownOpen(!isDropdownOpen);
@@ -178,6 +182,32 @@ export default function Header({
         </form>
 
         <div className="flex items-center gap-2">
+          {/* Write Post Button (로그인 사용자만) */}
+          {isLoggedIn && !isLoading && (
+            <button
+              onClick={() => router.push("/post/write")}
+              className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 rounded-full
+                     bg-secondary text-secondary-foreground text-sm font-medium
+                     transition-colors duration-200
+                     hover:bg-secondary/90"
+            >
+              <svg
+                className="w-5 h-5"
+                fill="none"
+                stroke="currentColor"
+                viewBox="0 0 24 24"
+              >
+                <path
+                  strokeLinecap="round"
+                  strokeLinejoin="round"
+                  strokeWidth={2}
+                  d="M12 4v16m8-8H4"
+                />
+              </svg>
+              <span>게시물 작성</span>
+            </button>
+          )}
+
           {/* Auth Button / Profile */}
           {isLoading ? (
             <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
diff --git a/app/types/index.ts b/app/types/index.ts
index 5a495d9..90076e8 100644
--- a/app/types/index.ts
+++ b/app/types/index.ts
@@ -72,3 +72,28 @@ export interface FilterState {
   selectedTags: string[];
   selectedTechBlogs: string[];
 }
+
+// 게시물 작성 요청
+export interface CreatePostRequest {
+  title: string;
+  content: string;
+  categoryPath: string;
+  tags: string[];
+}
+
+// 게시물 작성 응답
+export interface CreatePostResponse {
+  status: number;
+  data: {
+    id: string;
+    title: string;
+    content: string;
+    authorId: string;
+    authorName: string;
+    categoryPath: string;
+    tags: string[];
+    createdAt: string;
+    updatedAt: string;
+  };
+  message: string;
+}
```

---

## Memory Usage Notes

This memory captures the complete state of the `feat/write-post` feature implementation session. Use this to:
- Reference the feature structure when implementing the write post page component
- Recall API specifications for post creation
- Remember responsive layout requirements
- Review type definitions for request/response handling
- Understand the integration point with the header component

To retrieve this memory in future sessions:
```
read_memory: write-post-feature-implementation.md
```