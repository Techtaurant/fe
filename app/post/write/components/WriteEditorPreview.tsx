import type { Dispatch, SetStateAction } from "react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { FieldErrors } from "../lib/types";

interface WriteEditorPreviewProps {
  content: string;
  fieldErrors: FieldErrors;
  setContent: (value: string) => void;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
}

export default function WriteEditorPreview({
  content,
  fieldErrors,
  setContent,
  setFieldErrors,
}: WriteEditorPreviewProps) {
  return (
    <div className="mb-6 grid grid-cols-1 gap-0 lg:mb-8 lg:min-h-[500px] lg:grid-cols-2 lg:gap-6">
      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-border bg-background lg:min-h-0">
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

      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-border border-t-0 bg-background lg:min-h-0 lg:border-t">
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
  );
}
