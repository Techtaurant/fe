import { useMemo, useState } from "react";
import { CreatePostRequest, PostStatus } from "@/app/types";
import { extractAttachmentIdsFromContent } from "../lib/attachmentIds";
import { FieldErrors } from "../lib/types";

export function useWriteFormState() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryPath, setCategoryPath] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [thumbnailAttachmentId, setThumbnailAttachmentId] = useState<string | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isAuthExpiredModalOpen, setIsAuthExpiredModalOpen] = useState(false);
  const [autoSaveNotice, setAutoSaveNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    title: false,
    content: false,
    category: false,
  });

  const contentFingerprint = useMemo(
    () =>
      JSON.stringify({
        title,
        content,
        categoryPath,
        tags,
        thumbnailAttachmentId,
      }),
    [categoryPath, content, tags, thumbnailAttachmentId, title],
  );

  const hasEditableContent =
    title.trim().length > 0 ||
    content.trim().length > 0 ||
    categoryPath.trim().length > 0 ||
    tags.length > 0 ||
    Boolean(thumbnailAttachmentId);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const validateRequiredFields = ({ requireCategory = false }: { requireCategory?: boolean } = {}) => {
    const trimmedCategory = categoryPath.trim();
    const nextFieldErrors = {
      title: !title.trim(),
      content: !content.trim(),
      category: requireCategory && !trimmedCategory,
    };

    if (nextFieldErrors.title || nextFieldErrors.content || nextFieldErrors.category) {
      setError(null);
      setFieldErrors(nextFieldErrors);
      return false;
    }

    return true;
  };

  const buildPostPayload = (status: PostStatus): CreatePostRequest => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();
    const trimmedCategory = categoryPath.trim();

    return {
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      ...(trimmedContent ? { content: trimmedContent } : {}),
      ...(trimmedCategory ? { categoryPath: trimmedCategory } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      ...(trimmedContent
        ? { attachmentIds: extractAttachmentIdsFromContent(trimmedContent) }
        : {}),
      ...(thumbnailAttachmentId ? { thumbnailAttachmentId } : {}),
      status,
    };
  };

  const clearEditorState = () => {
    setTitle("");
    setContent("");
    setCategoryPath("");
    setTagInput("");
    setTags([]);
    setThumbnailAttachmentId(null);
    setThumbnailPreviewUrl(null);
    setFieldErrors({ title: false, content: false, category: false });
  };

  return {
    title,
    setTitle,
    content,
    setContent,
    categoryPath,
    setCategoryPath,
    tagInput,
    setTagInput,
    tags,
    setTags,
    thumbnailAttachmentId,
    setThumbnailAttachmentId,
    thumbnailPreviewUrl,
    setThumbnailPreviewUrl,
    error,
    setError,
    success,
    setSuccess,
    isPublishModalOpen,
    setIsPublishModalOpen,
    isAuthExpiredModalOpen,
    setIsAuthExpiredModalOpen,
    autoSaveNotice,
    setAutoSaveNotice,
    fieldErrors,
    setFieldErrors,
    contentFingerprint,
    hasEditableContent,
    handleAddTag,
    handleRemoveTag,
    validateRequiredFields,
    buildPostPayload,
    clearEditorState,
  };
}
