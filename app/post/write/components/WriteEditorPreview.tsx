import { useRef, useState } from "react";
import type { ChangeEvent, Dispatch, DragEvent, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";
import { FieldErrors } from "../lib/types";
import type { UploadedAttachment } from "@/app/services/attachments";

interface WriteEditorPreviewProps {
  content: string;
  fieldErrors: FieldErrors;
  setContent: (value: string) => void;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  isUploading: boolean;
  uploadError: string | null;
  onUploadImages: (files: File[]) => Promise<UploadedAttachment[]>;
  onClearUploadError: () => void;
}

function buildImageMarkdown(images: UploadedAttachment[]) {
  return images
    .map(({ attachmentId, fileName }) => `![${fileName}](${attachmentId})`)
    .join("\n\n");
}

export default function WriteEditorPreview({
  content,
  fieldErrors,
  setContent,
  setFieldErrors,
  isUploading,
  uploadError,
  onUploadImages,
  onClearUploadError,
}: WriteEditorPreviewProps) {
  const t = useTranslations("WritePage.editor");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const insertImagesAtCursor = (images: UploadedAttachment[]) => {
    const textarea = textareaRef.current;
    const imageMarkdown = buildImageMarkdown(images);

    if (!textarea) {
      const nextValue = content ? `${content}\n\n${imageMarkdown}` : imageMarkdown;
      setContent(nextValue);
      if (fieldErrors.content) {
        setFieldErrors((prev) => ({ ...prev, content: false }));
      }
      return;
    }

    const selectionStart = textarea.selectionStart ?? content.length;
    const selectionEnd = textarea.selectionEnd ?? content.length;
    const before = content.slice(0, selectionStart);
    const after = content.slice(selectionEnd);
    const prefix = before.length > 0 && !before.endsWith("\n") ? "\n\n" : "";
    const suffix = after.length > 0 && !after.startsWith("\n") ? "\n\n" : "";
    const nextValue = `${before}${prefix}${imageMarkdown}${suffix}${after}`;
    const nextCursor = before.length + prefix.length + imageMarkdown.length;

    setContent(nextValue);
    if (fieldErrors.content) {
      setFieldErrors((prev) => ({ ...prev, content: false }));
    }

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleImageFiles = async (files: File[]) => {
    if (files.length === 0) return;

    onClearUploadError();

    try {
      const uploadedImages = await onUploadImages(files);
      insertImagesAtCursor(uploadedImages);
    } catch {
      return;
    }
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    try {
      await handleImageFiles(files);
    } finally {
      event.target.value = "";
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);

    const files = Array.from(event.dataTransfer.files ?? []);
    await handleImageFiles(files);
  };

  return (
    <div className="mb-6 grid grid-cols-1 gap-0 lg:mb-8 lg:min-h-[500px] lg:grid-cols-2 lg:gap-6">
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
            return;
          }
          setIsDragActive(false);
        }}
        onDrop={(event) => {
          void handleDrop(event);
        }}
        className={`flex min-h-[400px] flex-col overflow-hidden rounded-lg border bg-background transition-colors lg:min-h-0 ${
          isDragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <div className="border-b border-border bg-muted p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {t("markdownEdit")} <span className="text-red-600">*</span>
            </h2>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                  void handleFileChange(event);
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUploading ? t("uploading") : t("addImage")}
              </button>
            </div>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            onClearUploadError();
            if (fieldErrors.content) {
              setFieldErrors((prev) => ({ ...prev, content: false }));
            }
          }}
          placeholder={t("contentPlaceholder")}
          className={`flex-1 resize-none border-0 bg-card p-4 font-mono text-base leading-relaxed text-foreground placeholder:text-muted-foreground placeholder:whitespace-pre focus:outline-none md:text-sm ${
            fieldErrors.content ? "outline outline-1 outline-red-500" : ""
          }`}
        />
        {uploadError && (
          <p className="border-t border-border bg-background px-4 py-2 text-sm font-medium text-red-600">
            {uploadError}
          </p>
        )}
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
