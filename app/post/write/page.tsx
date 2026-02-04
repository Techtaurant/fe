"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { httpPost } from "@/app/utils/httpClient";
import { CreatePostRequest, CreatePostResponse } from "@/app/types";

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
  const [success, setSuccess] = useState(false);

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

  /**
   * 게시물 작성 제출
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    if (!categoryPath.trim()) {
      setError("카테고리를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const postData: CreatePostRequest = {
        title: title.trim(),
        content: content.trim(),
        categoryPath: categoryPath.trim(),
        tags,
      };

      await httpPost<CreatePostResponse>("/api/posts", postData);

      setSuccess(true);
      setTitle("");
      setContent("");
      setCategoryPath("");
      setTags([]);
      setTagInput("");

      router.push("/?mode=user");
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
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            새로운 게시물 작성
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            마크다운 형식으로 글을 작성하고 실시간 미리보기를 확인할 수 있습니다.
          </p>
        </div>

        {/* 상단 입력 영역 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg bg-card p-4 shadow-sm md:rounded-xl md:p-6 lg:p-8"
        >
          {/* 제목 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시물의 제목을 입력하세요"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
            />
          </div>

          {/* 카테고리 */}
          <div className="mb-4 md:mb-6">
            <label htmlFor="category" className="mb-2 block text-sm font-semibold text-foreground">
              카테고리
            </label>
            <input
              id="category"
              type="text"
              value={categoryPath}
              onChange={(e) => setCategoryPath(e.target.value)}
              placeholder="예: java/spring/deepdive"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
            />
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
              <button
                type="button"
                onClick={handleAddTag}
                className="w-full cursor-pointer rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 md:w-auto"
              >
                추가
              </button>
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
          {error && (
            <div className="mb-6 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 rounded-lg border border-[#cfc] bg-[#efe] p-4 text-sm font-medium text-[#3c3]">
              게시물이 성공적으로 작성되었습니다!
            </div>
          )}

          {/* 콘텐츠 에디터 */}
          <div className="grid grid-cols-1 gap-0 mb-6 lg:mb-8 lg:grid-cols-2 lg:gap-6 lg:min-h-[500px]">
            <div className="min-h-[400px] flex flex-col overflow-hidden rounded-lg border border-border bg-background lg:min-h-0">
              <div className="border-b border-border bg-muted p-4">
                <h2 className="text-base font-semibold text-foreground">마크다운 편집</h2>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="마크다운 형식으로 내용을 입력하세요&#10;&#10;# 제목&#10;## 부제목&#10;&#10;**굵은 텍스트**&#10;*기울인 텍스트*&#10;&#10;- 리스트 항목&#10;&#10;```코드&#10;코드 블록&#10;```"
                className="flex-1 resize-none border-0 bg-card p-4 font-mono text-base leading-relaxed text-foreground placeholder:text-muted-foreground placeholder:whitespace-pre focus:outline-none md:text-sm"
              />
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
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "발행 중..." : "발행하기"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
