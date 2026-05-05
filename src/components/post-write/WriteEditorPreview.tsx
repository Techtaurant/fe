import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  Dispatch,
  DragEvent,
  SetStateAction,
} from "react";
import { useTranslations } from "next-intl";
import { ImagePlus } from "lucide-react";
import MarkdownRenderer from "../MarkdownRenderer";
import { FieldErrors } from "../../lib/post-write/types";
import type { UploadedAttachment } from "../../services/attachments";
import { fetchAttachmentPreviewUrl } from "../../services/attachments";

const ATTACHMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MARKDOWN_IMAGE_PATTERN = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g;
const HTML_IMAGE_PATTERN = /(<img[^>]+src=["'])([^"']+)(["'][^>]*>)/gi;

interface WriteEditorPreviewProps {
  content: string;
  fieldErrors: FieldErrors;
  editorHeader?: React.ReactNode;
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

function extractAttachmentIds(content: string): string[] {
  const attachmentIds = new Set<string>();

  for (const match of content.matchAll(MARKDOWN_IMAGE_PATTERN)) {
    const candidate = match[2]?.trim();
    if (candidate && ATTACHMENT_ID_PATTERN.test(candidate)) {
      attachmentIds.add(candidate);
    }
  }

  for (const match of content.matchAll(HTML_IMAGE_PATTERN)) {
    const candidate = match[2]?.trim();
    if (candidate && ATTACHMENT_ID_PATTERN.test(candidate)) {
      attachmentIds.add(candidate);
    }
  }

  return [...attachmentIds];
}

export default function WriteEditorPreview({
  content,
  fieldErrors,
  editorHeader,
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
  const [previewUrlByAttachmentId, setPreviewUrlByAttachmentId] = useState<
    Record<string, string>
  >({});
  const loadingAttachmentIdsRef = useRef<Set<string>>(new Set());
  const objectPreviewUrlByAttachmentIdRef = useRef<Map<string, string>>(new Map());
  const attachmentIdsInContent = useMemo(() => extractAttachmentIds(content), [content]);
  const resolvePreviewImageSrc = useCallback(
    (src: string): string | null => {
      if (ATTACHMENT_ID_PATTERN.test(src)) {
        return previewUrlByAttachmentId[src] ?? null;
      }

      return src;
    },
    [previewUrlByAttachmentId],
  );

  useEffect(() => {
    const usedAttachmentIds = new Set(attachmentIdsInContent);
    const revokedAttachmentIds: string[] = [];

    objectPreviewUrlByAttachmentIdRef.current.forEach((previewUrl, attachmentId) => {
      if (usedAttachmentIds.has(attachmentId)) {
        return;
      }

      URL.revokeObjectURL(previewUrl);
      objectPreviewUrlByAttachmentIdRef.current.delete(attachmentId);
      revokedAttachmentIds.push(attachmentId);
    });

    if (revokedAttachmentIds.length === 0) {
      return;
    }

    setPreviewUrlByAttachmentId((previous) => {
      const next = { ...previous };
      revokedAttachmentIds.forEach((attachmentId) => {
        delete next[attachmentId];
      });
      return next;
    });
  }, [attachmentIdsInContent]);

  useEffect(() => {
    const missingAttachmentIds = attachmentIdsInContent.filter(
      (attachmentId) =>
        !previewUrlByAttachmentId[attachmentId] &&
        !loadingAttachmentIdsRef.current.has(attachmentId),
    );

    if (missingAttachmentIds.length === 0) {
      return;
    }

    let isCancelled = false;
    missingAttachmentIds.forEach((attachmentId) => {
      loadingAttachmentIdsRef.current.add(attachmentId);
    });

    void Promise.all(
      missingAttachmentIds.map(async (attachmentId) => {
        try {
          const previewUrl = await fetchAttachmentPreviewUrl(attachmentId);
          return { attachmentId, previewUrl };
        } catch {
          return null;
        } finally {
          loadingAttachmentIdsRef.current.delete(attachmentId);
        }
      }),
    ).then((results) => {
      if (isCancelled) {
        return;
      }

      const resolvedEntries = results.filter(
        (entry): entry is { attachmentId: string; previewUrl: string } => entry !== null,
      );

      if (resolvedEntries.length === 0) {
        return;
      }

      setPreviewUrlByAttachmentId((previous) => {
        const next = { ...previous };
        resolvedEntries.forEach(({ attachmentId, previewUrl }) => {
          next[attachmentId] = previewUrl;
        });
        return next;
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [attachmentIdsInContent, previewUrlByAttachmentId]);

  useEffect(
    () => () => {
      objectPreviewUrlByAttachmentIdRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      objectPreviewUrlByAttachmentIdRef.current.clear();
    },
    [],
  );

  const registerUploadedImagePreviewUrls = (uploadedImages: UploadedAttachment[]) => {
    const nextPreviewUrlByAttachmentId: Record<string, string> = {};

    uploadedImages.forEach(({ attachmentId, previewUrl }) => {
      if (!previewUrl) {
        return;
      }

      nextPreviewUrlByAttachmentId[attachmentId] = previewUrl;
      if (previewUrl.startsWith("blob:")) {
        objectPreviewUrlByAttachmentIdRef.current.set(attachmentId, previewUrl);
      }
    });

    if (Object.keys(nextPreviewUrlByAttachmentId).length === 0) {
      return;
    }

    setPreviewUrlByAttachmentId((previous) => ({
      ...previous,
      ...nextPreviewUrlByAttachmentId,
    }));
  };

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
      registerUploadedImagePreviewUrls(uploadedImages);
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
    <div className="mb-8 grid grid-cols-1 gap-10 xl:mb-0 xl:min-h-screen xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:items-stretch xl:gap-0">
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
        className={`flex min-h-[420px] flex-col bg-background px-4 transition-colors md:px-5 xl:min-h-screen xl:px-6 ${
          isDragActive ? "bg-primary/5" : ""
        }`}
      >
        {editorHeader && <div className="mb-6">{editorHeader}</div>}
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
        <div className="flex-1 overflow-hidden bg-background">
          <div className="relative h-full">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute right-1 top-6 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60 md:right-1 md:top-8"
              aria-label={isUploading ? t("uploading") : t("addImage")}
            >
              <ImagePlus className="h-4 w-4" />
            </button>
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
              className={`h-full min-h-[420px] w-full resize-none border-0 bg-transparent px-0 py-6 pr-12 font-mono text-base leading-8 text-foreground placeholder:text-muted-foreground placeholder:whitespace-pre focus:outline-none md:py-8 md:pr-12 md:text-[15px] ${
                fieldErrors.content ? "outline outline-1 outline-red-500 outline-offset-[-1px]" : ""
              }`}
            />
          </div>
        </div>
        {uploadError && (
          <p className="mt-4 text-sm font-medium text-red-600">{uploadError}</p>
        )}
        {fieldErrors.content && (
          <p className="mt-2 text-sm font-medium text-red-600">{t("contentRequired")}</p>
        )}
      </div>

      <div className="min-h-[100dvh] bg-[#F4F7F4] dark:bg-zinc-800/40 xl:min-h-screen">
        <div className="min-h-[100dvh] overflow-hidden bg-transparent xl:min-h-screen">
          <div className="min-h-[100dvh] px-5 py-6 md:px-8 xl:h-full xl:min-h-screen xl:overflow-y-auto xl:px-12 xl:py-8">
              {content ? (
                <MarkdownRenderer
                  content={content}
                  resolveImageSrc={resolvePreviewImageSrc}
                />
              ) : (
                <div className="min-h-[240px]" />
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
