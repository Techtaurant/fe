"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import Header from "../../components/Header";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import { Post, Tag, User, Comment, FeedMode } from "../../types";

/**
 * 더미 데이터: 실제 구현에서는 API를 통해 데이터를 가져옴
 */
const DUMMY_TAGS: Tag[] = [
  { id: "1", name: "React" },
  { id: "2", name: "TypeScript" },
  { id: "3", name: "Next.js" },
  { id: "4", name: "Node.js" },
  { id: "5", name: "DevOps" },
];

const DUMMY_USERS: User[] = [
  {
    id: "u1",
    name: "김개발",
    email: "dev1@test.com",
    profileImageUrl: "",
    role: "USER",
  },
  {
    id: "u2",
    name: "이코딩",
    email: "dev2@test.com",
    profileImageUrl: "",
    role: "USER",
  },
  {
    id: "u3",
    name: "박해커",
    email: "dev3@test.com",
    profileImageUrl: "",
    role: "USER",
  },
];

const DUMMY_POSTS: Record<string, Post> = {
  u1: {
    id: "u1",
    type: "community",
    title: "주니어 개발자의 이직 회고",
    content: `## 들어가며

저는 올해 초 스타트업에서 중견 IT 기업으로 이직을 결심하게 되었습니다. 1년 반 정도 근무하면서 많은 것을 배웠지만, 더 체계적인 개발 문화를 경험하고 싶었습니다.

## 이직을 결심한 이유

첫 번째 회사에서 정말 많은 것을 배웠습니다. 작은 팀이었기 때문에 프론트엔드부터 백엔드, 인프라까지 다양한 경험을 할 수 있었죠. 하지만 점점 성장의 한계를 느끼기 시작했습니다.

- 코드 리뷰 문화의 부재
- 테스트 코드 작성 경험 부족
- 시니어 개발자에게 배울 기회 부족

## 이직 준비 과정

### 포트폴리오 정리
기존에 진행했던 프로젝트들을 정리하고, 개인 프로젝트도 하나 새로 시작했습니다. Next.js와 TypeScript를 활용한 풀스택 프로젝트였는데, 이 경험이 면접에서 큰 도움이 되었습니다.

### 알고리즘 공부
코딩 테스트를 위해 매일 1-2문제씩 풀었습니다. 처음에는 쉬운 문제도 못 풀었지만, 3개월 정도 꾸준히 하니 중급 문제까지는 어렵지 않게 풀 수 있게 되었습니다.

## 면접 후기

총 5개 회사에 지원해서 3개 회사에서 최종 합격을 받았습니다. 면접에서 가장 많이 받은 질문은:

1. 프로젝트에서 겪은 기술적 어려움과 해결 방법
2. 코드 품질을 위해 신경 쓰는 점
3. 팀 협업 경험

## 마무리

이직은 쉽지 않은 결정이었지만, 지금은 새로운 환경에서 많이 배우며 성장하고 있습니다. 혹시 이직을 고민하시는 분들께 도움이 되었으면 좋겠습니다.

질문이 있으시면 댓글로 남겨주세요! 🙌`,
    viewCount: 1200,
    likeCount: 56,
    commentCount: 12,
    tags: [DUMMY_TAGS[0]],
    author: DUMMY_USERS[0],
    isRead: false,
    publishedAt: "2025-01-16",
    url: "/post/u1",
  },
  u2: {
    id: "u2",
    type: "community",
    title: "사이드 프로젝트 실패 경험담",
    content: `## 프로젝트 소개

6개월간 진행했던 사이드 프로젝트 '개발자 네트워킹 플랫폼'에 대한 실패 경험을 공유합니다.

## 왜 시작했나

회사 업무 외에 무언가 만들고 싶었습니다. 개발자들이 서로 연결되어 스터디도 하고, 프로젝트도 함께 할 수 있는 플랫폼을 만들면 좋겠다고 생각했죠.

## 무엇이 문제였나

### 기술 스택 욕심
처음부터 너무 많은 기술을 적용하려 했습니다. Next.js, TypeScript, GraphQL, Prisma, Docker, Kubernetes... 학습 비용이 너무 컸습니다.

### 혼자서 모든 것을 하려 함
디자인, 프론트엔드, 백엔드, DevOps까지 혼자 다 하려니 진행 속도가 너무 느렸습니다.

### MVP 정의 실패
최소 기능 제품(MVP)을 제대로 정의하지 않고, 처음부터 완벽한 제품을 만들려 했습니다.

## 배운 점

1. **작게 시작하라**: 가장 핵심 기능 하나만 먼저 만들자
2. **익숙한 기술을 사용하라**: 새로운 기술 학습은 별도로
3. **함께 하라**: 혼자보다 함께가 빠르다

다음 사이드 프로젝트에서는 이 교훈을 꼭 적용할 예정입니다.`,
    viewCount: 3400,
    likeCount: 128,
    commentCount: 45,
    tags: [DUMMY_TAGS[2], DUMMY_TAGS[4]],
    author: DUMMY_USERS[1],
    isRead: false,
    publishedAt: "2025-01-15",
    url: "/post/u2",
  },
  u3: {
    id: "u3",
    type: "community",
    title: "오늘 배운 알고리즘 정리",
    content: `## 이진 탐색 (Binary Search)

오늘은 이진 탐색에 대해 공부했습니다. 정렬된 배열에서 특정 값을 찾을 때 사용하는 알고리즘입니다.

### 시간 복잡도
- O(log n)

### 알고리즘 흐름도

\`\`\`mermaid
flowchart TD
    A["시작: left=0, right=n-1"] --> B{"left <= right?"}
    B -->|Yes| C["mid 계산"]
    C --> D{"arr mid == target?"}
    D -->|Yes| E["return mid"]
    D -->|No| F{"arr mid < target?"}
    F -->|Yes| G["left = mid + 1"]
    F -->|No| H["right = mid - 1"]
    G --> B
    H --> B
    B -->|No| I["return -1"]
\`\`\`

### 구현 코드

\`\`\`typescript
function binarySearch(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
\`\`\`

### 활용 문제
- LeetCode 704. Binary Search
- 프로그래머스 입국심사

| 알고리즘 | 시간 복잡도 | 공간 복잡도 |
|----------|-------------|-------------|
| 이진 탐색 | O(log n) | O(1) |
| 선형 탐색 | O(n) | O(1) |

내일은 DFS/BFS를 공부할 예정입니다! 📚`,
    viewCount: 150,
    likeCount: 5,
    commentCount: 0,
    tags: [{ id: "12", name: "Algorithm" }],
    author: DUMMY_USERS[2],
    isRead: false,
    publishedAt: "2025-01-14",
    url: "/post/u3",
  },
};

const DUMMY_COMMENTS: Record<string, Comment[]> = {
  u1: [
    {
      id: "c1",
      content:
        "정말 도움이 많이 되었습니다! 저도 이직 준비 중인데 용기를 얻었어요.",
      author: DUMMY_USERS[1],
      createdAt: "2025-01-16",
      likeCount: 12,
    },
    {
      id: "c2",
      content: "알고리즘 공부는 어떤 자료로 하셨나요?",
      author: DUMMY_USERS[2],
      createdAt: "2025-01-16",
      likeCount: 5,
    },
  ],
  u2: [
    {
      id: "c3",
      content:
        "저도 비슷한 경험이 있어서 공감됩니다... MVP의 중요성을 다시 한번 느끼네요.",
      author: DUMMY_USERS[0],
      createdAt: "2025-01-15",
      likeCount: 8,
    },
  ],
  u3: [],
};

/**
 * 게시물 상세 페이지 컴포넌트
 * 커뮤니티 게시물의 전체 내용과 댓글을 표시
 */
export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentMode] = useState<FeedMode>("user");

  useEffect(() => {
    // 실제 구현에서는 API 호출로 대체
    const foundPost = DUMMY_POSTS[postId];
    const foundComments = DUMMY_COMMENTS[postId] || [];

    if (foundPost) {
      setPost(foundPost);
      setComments(foundComments);
    }
  }, [postId]);

  const formatCount = (count: number): string => {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}천`;
    return count.toString();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    if (post) {
      setPost({
        ...post,
        likeCount: (post.likeCount || 0) + (isLiked ? -1 : 1),
      });
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("링크가 복사되었습니다!");
    } catch {
      alert("링크 복사에 실패했습니다.");
    }
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header
          onMenuClick={() => {}}
          currentMode={currentMode}
          onModeChange={() => {}}
        />
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-muted-foreground">
            게시물을 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuClick={() => {}}
        currentMode={currentMode}
        onModeChange={() => {}}
      />

      <main className="max-w-[728px] mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200 mb-6"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="text-sm font-medium">돌아가기</span>
        </button>

        {/* 게시물 헤더 */}
        <header className="mb-8">
          {/* 제목 */}
          <h1 className="text-2xl md:text-4xl font-bold text-foreground leading-tight mb-6">
            {post.title}
          </h1>

          {/* 작성자 정보 */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              {post.author?.profileImageUrl ? (
                <Image
                  src={post.author.profileImageUrl}
                  alt={post.author.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-muted-foreground">
                  {post.author?.name.charAt(0) || "?"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">
                {post.author?.name}
              </span>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{post.publishedAt}</span>
                <span>•</span>
                <span>
                  {Math.ceil((post.content?.length || 0) / 500)} min read
                </span>
              </div>
            </div>
            <button
              className="ml-auto px-4 py-1.5 rounded-full border border-success text-success text-sm font-medium hover:bg-success hover:text-success-foreground transition-colors duration-200"
            >
              팔로우
            </button>
          </div>

          {/* 상호작용 바 */}
          <div className="flex items-center justify-between py-3 border-y border-border">
            <div className="flex items-center gap-4">
              {/* 좋아요 */}
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 text-sm transition-colors duration-200
                         ${
                           isLiked
                             ? "text-success"
                             : "text-muted-foreground hover:text-foreground"
                         }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span>{formatCount(post.likeCount || 0)}</span>
              </button>

              {/* 댓글 */}
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{formatCount(post.commentCount || 0)}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* 북마크 */}
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-full transition-colors duration-200
                         ${
                           isBookmarked
                             ? "text-foreground"
                             : "text-muted-foreground hover:text-foreground"
                         }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </button>

              {/* 공유 */}
              <button
                onClick={handleShare}
                className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
              </button>

              {/* 더보기 */}
              <button
                className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 게시물 본문 */}
        <article className="mb-12">
          <MarkdownRenderer content={post.content || ""} />
        </article>

        {/* 태그 */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-3 py-1.5 rounded-full bg-muted/60 text-sm text-muted-foreground hover:bg-muted cursor-pointer transition-colors duration-200"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* 구분선 */}
        <div className="h-px bg-border mb-8" />

        {/* 댓글 섹션 */}
        <section>
          <h3 className="text-lg font-bold text-foreground mb-6">
            댓글 ({comments.length})
          </h3>

          {/* 댓글 입력 */}
          <div className="flex gap-3 mb-8">
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground">
                ?
              </span>
            </div>
            <div className="flex-1">
              <textarea
                placeholder="댓글을 작성해주세요..."
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:border-ring transition-colors duration-200"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  className="px-4 py-2 rounded-full bg-success text-success-foreground text-sm font-medium hover:opacity-90 transition-opacity duration-200"
                >
                  댓글 작성
                </button>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="flex flex-col gap-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                    {comment.author.profileImageUrl ? (
                      <Image
                        src={comment.author.profileImageUrl}
                        alt={comment.author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {comment.author.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">
                        {comment.author.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {comment.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed mb-2">
                      {comment.content}
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>{comment.likeCount}</span>
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-foreground">
                        답글
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
