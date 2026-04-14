import { useRef } from "react";
import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { Image as ImageIcon } from "lucide-react";
import { FieldErrors } from "../lib/types";

interface WriteFormFieldsProps {
  title: string;
  categoryPath: string;
  tagInput: string;
  tags: string[];
  hasThumbnail: boolean;
  isThumbnailUploading: boolean;
  thumbnailUploadError: string | null;
  fieldErrors: FieldErrors;
  setTitle: (value: string) => void;
  setCategoryPath: (value: string) => void;
  setTagInput: (value: string) => void;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  handleTagKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveTag: (tag: string) => void;
  handleUploadThumbnail: (file: File) => Promise<void>;
}

export default function WriteFormFields({
  title,
  categoryPath,
  tagInput,
  tags,
  hasThumbnail,
  isThumbnailUploading,
  thumbnailUploadError,
  fieldErrors,
  setTitle,
  setCategoryPath,
  setTagInput,
  setFieldErrors,
  handleTagKeyPress,
  handleRemoveTag,
  handleUploadThumbnail,
}: WriteFormFieldsProps) {
  const t = useTranslations("WritePage.form");
  const tagInputRef = useRef<HTMLInputElement | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <div className="mb-4 md:mb-6">
        <div className="relative pr-12">
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
            placeholder={t("titlePlaceholder")}
            className={`w-full border-0 bg-transparent px-0 py-0 text-2xl font-semibold tracking-[-0.04em] text-foreground transition-colors duration-200 placeholder:text-muted-foreground/80 focus:outline-none md:text-3xl xl:text-4xl ${
              fieldErrors.title
                ? "text-red-600 placeholder:text-red-300"
                : ""
            }`}
          />
          <>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];

                try {
                  if (file) {
                    await handleUploadThumbnail(file);
                  }
                } finally {
                  event.target.value = "";
                }
              }}
            />
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isThumbnailUploading}
              className={`absolute right-1 top-0 inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                hasThumbnail
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
              aria-label="썸네일 이미지 추가"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
          </>
        </div>
        <div className="mt-4 h-1.5 w-16 bg-foreground/80" />
        {fieldErrors.title && (
          <p className="mt-2 text-sm font-medium text-red-600">{t("titleRequired")}</p>
        )}
      </div>

      <div className="mb-5 space-y-4 md:mb-6">
        <div>
          <label htmlFor="category" className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("category")} <span className="text-red-600">*</span>
          </label>
          <input
            id="category"
            type="text"
            autoComplete="off"
            value={categoryPath}
            onChange={(e) => {
              setCategoryPath(e.target.value);
              if (fieldErrors.category) {
                setFieldErrors((prev) => ({ ...prev, category: false }));
              }
            }}
            placeholder={t("categoryPlaceholder")}
            className={`w-full bg-transparent px-0 py-0 text-base text-muted-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:outline-none [&:-webkit-autofill]:shadow-[inset_0_0_0px_1000px_transparent] [&:-webkit-autofill]:[-webkit-text-fill-color:currentColor] ${
              fieldErrors.category ? "text-red-600 placeholder:text-red-300" : ""
            }`}
          />
          {fieldErrors.category && (
            <p className="mt-2 text-sm font-medium text-red-600">{t("categoryRequired")}</p>
          )}
        </div>

        <div>
          <label htmlFor="tags" className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            {t("tags")}
          </label>
          <div
            className="flex cursor-text flex-wrap items-center gap-x-2 gap-y-2"
            onClick={() => tagInputRef.current?.focus()}
          >
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
                  aria-label={t("removeTag", { tag })}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder={tags.length === 0 ? t("tagsPlaceholder") : ""}
              className="min-w-[180px] flex-1 bg-transparent px-0 py-0 text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
        </div>
      </div>

      {thumbnailUploadError && (
        <p className="mt-3 text-sm font-medium text-red-600">{thumbnailUploadError}</p>
      )}
    </>
  );
}
