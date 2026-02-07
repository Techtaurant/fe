"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { createPost } from "@/app/services/posts";
import { CreatePostRequest, CreatePostResponse, Post } from "@/app/types";

/**
 * 게시물 작성 페이지
 * - 왼쪽: 마크다운 에디터
 * - 오른쪽: 실시간 프리뷰
 */
export default function WritePostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryPath, setCategoryPath] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    title: false,
    content: false,
    categoryPath: false,
  });

  /**
   * 태그 추가 처리
   */
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  /**
   * 태그 제거 처리
   */
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  /**
   * Enter 키로 태그 추가
   */
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = () => {
    const nextFieldErrors = {
      title: !title.trim(),
      content: !content.trim(),
      categoryPath: !categoryPath.trim(),
    };

    if (nextFieldErrors.title || nextFieldErrors.content || nextFieldErrors.categoryPath) {
      setError(null);
      setFieldErrors(nextFieldErrors);
      return false;
    }

    return true;
  };

  /**
   * 게시물 작성 제출
   */
  const handleSubmit = async (status: CreatePostRequest["status"]) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    setFieldErrors({ title: false, content: false, categoryPath: false });

    try {
      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        categoryPath: categoryPath.trim(),
        tags,
        status,
      };

      let result: CreatePostResponse;

      try {
        result = await createPost(postData);
      } catch (apiError) {
        const message = apiError instanceof Error ? apiError.message : "UNKNOWN";
        if (message === "UNAUTHORIZED") {
          setError("인증되지 않은 사용자입니다. 로그인 후 다시 시도해주세요.");
          return;
        }
        if (message === "BAD_REQUEST") {
          setError("잘못된 요청입니다. 입력값을 확인해주세요.");
          return;
        }
        if (message.startsWith("HTTP_")) {
          setError(`요청에 실패했습니다. (${message.replace("HTTP_", "")})`);
          return;
        }
        setError(message || "게시물 작성 중 오류가 발생했습니다.");
        return;
      }

      const createdAt = new Date(result.data.createdAt);
      const resolvedTags = result.data.tags.map((name) => ({
        id: name,
        name,
      }));
      const newPost: Post = {
        id: result.data.id,
        type: "community",
        title: result.data.title,
        content: result.data.content,
        viewCount: 0,
        likeCount: 0,
        commentCount: 0,
        tags: resolvedTags,
        author: {
          id: result.data.authorId,
          name: result.data.authorName,
          email: "",
          profileImageUrl: "",
          role: "USER",
        },
        isRead: false,
        publishedAt: createdAt.toISOString().slice(0, 10),
        url: `/post/${result.data.id}`,
      };

      if (status === "DRAFT") {
        setSuccess("게시물이 임시저장되었습니다.");
      } else if (status === "PRIVATE") {
        setSuccess("게시물이 비공개로 저장되었습니다.");
      } else {
        setSuccess("게시물이 성공적으로 작성되었습니다!");
      }
      setTitle("");
      setContent("");
      setCategoryPath("");
      setTags([]);
      setTagInput("");
      setFieldErrors({ title: false, content: false, categoryPath: false });

      if (status === "PUBLISHED") {
        router.push("/?mode=user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "게시물 작성 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 md:px-4 md:py-6">
      <div className="mx-auto max-w-[1400px]">
        {/* 입력 영역 */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isSubmitting) {
              if (validateForm()) setIsPublishModalOpen(true);
            }
          }}
          className="rounded-lg bg-card p-4 shadow-sm md:rounded-xl md:p-6 lg:p-8"
        >
          {/* 제목 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">
              제목 <span className="text-red-600">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: false }));
                }
              }}
              placeholder="게시물의 제목을 입력하세요"
              className={`w-full rounded-lg border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:bg-card focus:outline-none ${
                fieldErrors.title
                  ? "border-red-500 focus:border-red-500"
                  : "border-border focus:border-primary"
              }`}
            />
            {fieldErrors.title && (
              <p className="mt-2 text-sm font-medium text-red-600">제목을 입력해주세요.</p>
            )}
          </div>

          {/* 카테고리 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-foreground">
              카테고리 <span className="text-red-600">*</span>
            </label>
            <input
              id="category"
              type="text"
              value={categoryPath}
              onChange={(e) => {
                setCategoryPath(e.target.value);
                if (fieldErrors.categoryPath) {
                  setFieldErrors((prev) => ({ ...prev, categoryPath: false }));
                }
              }}
              placeholder="예: java/spring/deepdive"
              className={`w-full rounded-lg border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:bg-card focus:outline-none ${
                fieldErrors.categoryPath
                  ? "border-red-500 focus:border-red-500"
                  : "border-border focus:border-primary"
              }`}
            />
            {fieldErrors.categoryPath && (
              <p className="mt-2 text-sm font-medium text-red-600">카테고리를 입력해주세요.</p>
            )}
          </div>

          {/* 태그 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="tags" className="mb-2 block text-sm font-semibold text-foreground">
              태그
            </label>
            <div className="flex flex-col gap-2 md:flex-row">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="w-full flex-1 rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
              />
            </div>

            {/* 태그 목록 */}
            {tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-foreground"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="cursor-pointer border-0 bg-transparent p-0 text-lg text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={`${tag} 제거`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 에러/성공 메시지 */}
          {error && !(fieldErrors.title || fieldErrors.content || fieldErrors.categoryPath) && (
            <div className="mb-6 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-[#cfc] bg-[#efe] p-4 text-sm font-medium text-[#3c3]">
              {success}
            </div>
          )}

          {/* 콘텐츠 에디터 */}
          <div className="grid grid-cols-1 gap-0 mb-6 lg:mb-8 lg:grid-cols-2 lg:gap-6 lg:min-h-[500px]">
            <div className="min-h-[400px] flex flex-col overflow-hidden rounded-lg border border-border bg-background lg:min-h-0">
              <div className="border-b border-border bg-muted p-4">
                <h2 className="text-base font-semibold text-foreground">
                  마크다운 편집 <span className="text-red-600">*</span>
                </h2>
              </div>
              <textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (fieldErrors.content) {
                    setFieldErrors((prev) => ({ ...prev, content: false }));
                  }
                }}
                placeholder="마크다운 형식으로 내용을 입력하세요&#10;&#10;# 제목&#10;## 부제목&#10;&#10;**굵은 텍스트**&#10;*기울인 텍스트*&#10;&#10;- 리스트 항목&#10;&#10;```코드&#10;코드 블록&#10;```"
                className={`flex-1 resize-none border-0 bg-card p-4 font-mono text-base leading-relaxed text-foreground placeholder:text-muted-foreground placeholder:whitespace-pre focus:outline-none md:text-sm ${
                  fieldErrors.content ? "outline outline-1 outline-red-500" : ""
                }`}
              />
              {fieldErrors.content && (
                <p className="border-t border-border bg-background px-4 py-2 text-sm font-medium text-red-600">
                  내용을 입력해주세요.
                </p>
              )}
            </div>

            {/* 프리뷰 */}
            <div className="min-h-[400px] flex flex-col overflow-hidden rounded-lg border border-border border-t-0 bg-background lg:min-h-0 lg:border-t">
              <div className="border-b border-border bg-muted p-4">
                <h2 className="text-base font-semibold text-foreground">미리보기</h2>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-muted-foreground">
                    <p>마크다운 내용을 입력하면 여기에 미리보기가 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("DRAFT")}
              className="rounded-lg border border-border px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              임시저장
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                if (validateForm()) setIsPublishModalOpen(true);
              }}
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "발행 중..." : "발행하기"}
            </button>
          </div>
        </form>

        {isPublishModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-foreground">
                게시물 공개 설정
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                발행할 게시물의 공개 범위를 선택해주세요.
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsPublishModalOpen(false);
                    handleSubmit("PUBLISHED");
                  }}
                  className="w-full rounded-lg bg-primary px-4 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  전체 공개로 발행
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setIsPublishModalOpen(false);
                    handleSubmit("PRIVATE");
                  }}
                  className="w-full rounded-lg border border-border px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  비공개로 발행
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsPublishModalOpen(false)}
                  className="w-full rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
