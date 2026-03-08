import type { Dispatch, SetStateAction } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("WritePage.editor");

  return (
    <div className="mb-6 grid grid-cols-1 gap-0 lg:mb-8 lg:min-h-[500px] lg:grid-cols-2 lg:gap-6">
      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-border bg-background lg:min-h-0">
        <div className="border-b border-border bg-muted p-4">
          <h2 className="text-base font-semibold text-foreground">
            {t("markdownEdit")} <span className="text-red-600">*</span>
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
          placeholder={t("contentPlaceholder")}
          className={`flex-1 resize-none border-0 bg-card p-4 font-mono text-base leading-relaxed text-foreground placeholder:text-muted-foreground placeholder:whitespace-pre focus:outline-none md:text-sm ${
            fieldErrors.content ? "outline outline-1 outline-red-500" : ""
          }`}
        />
        {fieldErrors.content && (
          <p className="border-t border-border bg-background px-4 py-2 text-sm font-medium text-red-600">
            {t("contentRequired")}
          </p>
        )}
      </div>

      <div className="flex min-h-[400px] flex-col overflow-hidden rounded-lg border border-border border-t-0 bg-background lg:min-h-0 lg:border-t">
        <div className="border-b border-border bg-muted p-4">
          <h2 className="text-base font-semibold text-foreground">{t("preview")}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {content ? (
            <MarkdownRenderer content={content} />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>{t("previewEmpty")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
