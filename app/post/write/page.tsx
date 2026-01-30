"use client";

import { useState } from "react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { httpPost } from "@/app/utils/httpClient";
import { CreatePostRequest, CreatePostResponse } from "@/app/types";

/**
 * 게시물 작성 페이지
 * - 왼쪽: 마크다운 에디터
 * - 오른쪽: 실시간 프리뷰
 */
export default function WritePostPage() {
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

      // 성공 메시지 3초 후 자동 사라짐
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "게시물 작성 중 오류가 발생했습니다.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="write-page-container">
      <div className="write-page-wrapper">
        {/* 헤더 */}
        <div className="write-header">
          <h1>새로운 게시물 작성</h1>
          <p>마크다운 형식으로 글을 작성하고 실시간 미리보기를 확인할 수 있습니다.</p>
        </div>

        {/* 상단 입력 영역 */}
        <form onSubmit={handleSubmit} className="write-form">
          {/* 제목 */}
          <div className="form-section">
            <label htmlFor="title" className="form-label">
              제목
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="게시물의 제목을 입력하세요"
              className="form-input title-input"
            />
          </div>

          {/* 카테고리 */}
          <div className="form-section">
            <label htmlFor="category" className="form-label">
              카테고리
            </label>
            <input
              id="category"
              type="text"
              value={categoryPath}
              onChange={(e) => setCategoryPath(e.target.value)}
              placeholder="예: java/spring/deepdive"
              className="form-input"
            />
          </div>

          {/* 태그 */}
          <div className="form-section">
            <label htmlFor="tags" className="form-label">
              태그
            </label>
            <div className="tag-input-wrapper">
              <input
                id="tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                placeholder="태그를 입력하고 Enter를 누르세요"
                className="form-input"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="tag-add-button"
              >
                추가
              </button>
            </div>

            {/* 태그 목록 */}
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map((tag) => (
                  <span key={tag} className="tag-badge">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="tag-remove-button"
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
          {error && <div className="message-box error-message">{error}</div>}
          {success && (
            <div className="message-box success-message">
              게시물이 성공적으로 작성되었습니다!
            </div>
          )}

          {/* 콘텐츠 에디터 */}
          <div className="editor-container">
            <div className="editor-panel">
              <div className="editor-header">
                <h2>마크다운 편집</h2>
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="마크다운 형식으로 내용을 입력하세요&#10;&#10;# 제목&#10;## 부제목&#10;&#10;**굵은 텍스트**&#10;*기울인 텍스트*&#10;&#10;- 리스트 항목&#10;&#10;```코드&#10;코드 블록&#10;```"
                className="markdown-editor"
              />
            </div>

            {/* 프리뷰 */}
            <div className="preview-panel">
              <div className="preview-header">
                <h2>미리보기</h2>
              </div>
              <div className="preview-content">
                {content ? (
                  <MarkdownRenderer content={content} />
                ) : (
                  <div className="preview-empty">
                    <p>마크다운 내용을 입력하면 여기에 미리보기가 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={isSubmitting}
              className="submit-button"
            >
              {isSubmitting ? "작성 중..." : "게시물 작성"}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .write-page-container {
          min-height: 100vh;
          background-color: var(--background);
          padding: 24px 16px;
        }

        .write-page-wrapper {
          max-width: 1400px;
          margin: 0 auto;
        }

        .write-header {
          margin-bottom: 32px;
        }

        .write-header h1 {
          font-size: 32px;
          font-weight: 700;
          color: var(--foreground);
          margin-bottom: 8px;
        }

        .write-header p {
          font-size: 16px;
          color: var(--muted-foreground);
        }

        .write-form {
          background-color: var(--card);
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: var(--foreground);
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 16px;
          color: var(--foreground);
          background-color: var(--background);
          transition: border-color 0.2s ease, background-color 0.2s ease;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          background-color: var(--card);
        }

        .form-input::placeholder {
          color: var(--muted-foreground);
        }

        .title-input {
          font-size: 18px;
          font-weight: 600;
        }

        .tag-input-wrapper {
          display: flex;
          gap: 8px;
        }

        .tag-input-wrapper .form-input {
          flex: 1;
        }

        .tag-add-button {
          padding: 12px 20px;
          background-color: var(--primary);
          color: var(--primary-foreground);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .tag-add-button:hover {
          opacity: 0.9;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 12px;
        }

        .tag-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background-color: var(--muted);
          color: var(--foreground);
          border-radius: 20px;
          font-size: 14px;
        }

        .tag-remove-button {
          background: none;
          border: none;
          color: var(--muted-foreground);
          cursor: pointer;
          font-size: 18px;
          padding: 0;
          transition: color 0.2s ease;
        }

        .tag-remove-button:hover {
          color: var(--foreground);
        }

        .message-box {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 14px;
          font-weight: 500;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          border: 1px solid #fcc;
        }

        .success-message {
          background-color: #efe;
          color: #3c3;
          border: 1px solid #cfc;
        }

        .editor-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
          min-height: 500px;
        }

        .editor-panel,
        .preview-panel {
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--background);
          overflow: hidden;
        }

        .editor-header,
        .preview-header {
          padding: 16px;
          border-bottom: 1px solid var(--border);
          background-color: var(--muted);
        }

        .editor-header h2,
        .preview-header h2 {
          font-size: 16px;
          font-weight: 600;
          color: var(--foreground);
          margin: 0;
        }

        .markdown-editor {
          flex: 1;
          padding: 16px;
          border: none;
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo,
            monospace;
          font-size: 14px;
          line-height: 1.6;
          color: var(--foreground);
          background-color: var(--card);
          resize: none;
        }

        .markdown-editor:focus {
          outline: none;
        }

        .markdown-editor::placeholder {
          color: var(--muted-foreground);
          white-space: pre;
        }

        .preview-content {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
        }

        .preview-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--muted-foreground);
          text-align: center;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .submit-button {
          padding: 12px 32px;
          background-color: var(--primary);
          color: var(--primary-foreground);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .submit-button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* 모바일 반응형 */
        @media (max-width: 1024px) {
          .editor-container {
            grid-template-columns: 1fr;
            gap: 0;
            min-height: auto;
          }

          .editor-panel {
            min-height: 400px;
          }

          .preview-panel {
            min-height: 400px;
            border-top: none;
          }

          .write-form {
            padding: 24px 16px;
          }
        }

        @media (max-width: 768px) {
          .write-page-container {
            padding: 16px 12px;
          }

          .write-header h1 {
            font-size: 24px;
          }

          .write-form {
            border-radius: 8px;
            padding: 16px;
          }

          .form-section {
            margin-bottom: 16px;
          }

          .tag-input-wrapper {
            flex-direction: column;
          }

          .tag-add-button {
            width: 100%;
          }

          .editor-container {
            margin-bottom: 24px;
          }

          .markdown-editor {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
