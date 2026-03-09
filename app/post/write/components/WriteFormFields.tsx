import type { Dispatch, KeyboardEvent, SetStateAction } from "react";
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
  return (
    <>
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
    </>
  );
}
