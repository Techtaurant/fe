import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
import { useTranslations } from "next-intl";
import { FieldErrors } from "../lib/types";

interface WriteFormFieldsProps {
  title: string;
  categoryPath: string;
  tagInput: string;
  tags: string[];
  fieldErrors: FieldErrors;
  setTitle: (value: string) => void;
  setCategoryPath: (value: string) => void;
  setTagInput: (value: string) => void;
  setFieldErrors: Dispatch<SetStateAction<FieldErrors>>;
  handleTagKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  handleRemoveTag: (tag: string) => void;
}

export default function WriteFormFields({
  title,
  categoryPath,
  tagInput,
  tags,
  fieldErrors,
  setTitle,
  setCategoryPath,
  setTagInput,
  setFieldErrors,
  handleTagKeyPress,
  handleRemoveTag,
}: WriteFormFieldsProps) {
  const t = useTranslations("WritePage.form");

  return (
    <>
      <div className="mb-4 md:mb-6">
        <label htmlFor="title" className="mb-2 block text-sm font-semibold text-foreground">
          {t("title")} <span className="text-red-600">*</span>
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
          placeholder={t("titlePlaceholder")}
          className={`w-full rounded-lg border bg-background px-4 py-3 text-base font-semibold text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:bg-card focus:outline-none ${
            fieldErrors.title
              ? "border-red-500 focus:border-red-500"
              : "border-border focus:border-primary"
          }`}
        />
        {fieldErrors.title && (
          <p className="mt-2 text-sm font-medium text-red-600">{t("titleRequired")}</p>
        )}
      </div>

      <div className="mb-4 md:mb-6">
        <label htmlFor="category" className="mb-2 block text-sm font-semibold text-foreground">
          {t("category")} <span className="text-red-600">*</span>
        </label>
        <input
          id="category"
          type="text"
          value={categoryPath}
          onChange={(e) => {
            setCategoryPath(e.target.value);
            if (fieldErrors.category) {
              setFieldErrors((prev) => ({ ...prev, category: false }));
            }
          }}
          placeholder={t("categoryPlaceholder")}
          className={`w-full rounded-lg border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:bg-card focus:outline-none ${
            fieldErrors.category
              ? "border-red-500 focus:border-red-500"
              : "border-border focus:border-primary"
          }`}
        />
        {fieldErrors.category && (
          <p className="mt-2 text-sm font-medium text-red-600">{t("categoryRequired")}</p>
        )}
      </div>

      <div className="mb-4 md:mb-6">
        <label htmlFor="tags" className="mb-2 block text-sm font-semibold text-foreground">
          {t("tags")}
        </label>
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            placeholder={t("tagsPlaceholder")}
            className="w-full flex-1 rounded-lg border border-border bg-background px-4 py-3 text-base text-foreground transition-colors duration-200 placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:outline-none"
          />
        </div>

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
                  aria-label={t("removeTag", { tag })}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
