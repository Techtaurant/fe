"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useUserCategories } from "@/app/hooks/useUserCategories";
import { useTags } from "@/app/hooks/useTags";
import { redirectToOAuthLogin } from "@/app/lib/authRedirect";
import { useUser } from "@/app/hooks/useUser";
import { queryKeys } from "@/app/lib/queryKeys";
import AuthExpiredModal from "./components/AuthExpiredModal";
import PublishScopeModal from "./components/PublishScopeModal";
import WriteActions from "./components/WriteActions";
import WriteEditorPreview from "./components/WriteEditorPreview";
import WriteFormFields from "./components/WriteFormFields";
import { useAutoSave } from "./hooks/useAutoSave";
import { useDraftBootstrap } from "./hooks/useDraftBootstrap";
import { usePostImageUpload } from "./hooks/usePostImageUpload";
import { usePostThumbnail } from "./hooks/usePostThumbnail";
import { usePublishFlow } from "./hooks/usePublishFlow";
import { useSessionPrecheck } from "./hooks/useSessionPrecheck";
import { useWriteFormState } from "./hooks/useWriteFormState";
import { getLocalDraftStorageKey } from "./lib/constants";
import {
  clearLocalDraftSnapshot,
  clearPendingPublishSnapshot,
  writeLocalDraftSnapshot,
} from "./lib/storage";

function WritePostPageContent() {
  const t = useTranslations("WritePage");
  const locale = useLocale();
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { user, isLoading: isUserLoading } = useUser();
  const draftId = searchParams.get("draftId");
  const postId = searchParams.get("postId");
  const isPostEditMode = Boolean(postId);
  const localDraftStorageKey = getLocalDraftStorageKey(draftId);
  const draftCountQueryKey = [...queryKeys.posts.all, "drafts-count"] as const;

  const form = useWriteFormState();
  const imageUpload = usePostImageUpload();
  const { setError, setSuccess } = form;
  const thumbnail = usePostThumbnail({
    thumbnailAttachmentId: form.thumbnailAttachmentId,
    thumbnailPreviewUrl: form.thumbnailPreviewUrl,
    setThumbnailAttachmentId: form.setThumbnailAttachmentId,
    setThumbnailPreviewUrl: form.setThumbnailPreviewUrl,
  });

  const draftBootstrap = useDraftBootstrap({
    draftId,
    postId,
    draftCountQueryKey,
    setTitle: form.setTitle,
    setContent: form.setContent,
    setCategoryPath: form.setCategoryPath,
    setTags: form.setTags,
    setThumbnail: form.setThumbnailAttachmentId,
    clearThumbnailPreview: thumbnail.clearThumbnailPreview,
  });

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [draftId, setError, setSuccess]);

  useEffect(() => {
    if (isUserLoading || user) return;
    redirectToOAuthLogin({
      redirectPath: `/${locale}/post/write${window.location.search}`,
    });
  }, [isUserLoading, locale, user]);

  const writeLocalSnapshot = () => {
    writeLocalDraftSnapshot(localDraftStorageKey, {
      draftId,
      title: form.title,
      content: form.content,
      categoryPath: form.categoryPath,
      tags: form.tags,
      thumbnailAttachmentId: form.thumbnailAttachmentId,
    });
  };

  const clearLocalSnapshot = () => {
    clearLocalDraftSnapshot(localDraftStorageKey);
  };

  const openAuthExpiredModal = () => {
    form.setIsPublishModalOpen(false);
    form.setError(t("errors.authExpired"));
    form.setIsAuthExpiredModalOpen(true);
  };

  useSessionPrecheck({
    user,
    hasEditableContent: form.hasEditableContent,
    isAuthExpiredModalOpen: form.isAuthExpiredModalOpen,
    contentFingerprint: form.contentFingerprint,
    onAuthExpired: openAuthExpiredModal,
  });

  const categorySuggestionsQuery = useUserCategories({
    enabled: Boolean(user?.id),
    userId: user?.id ?? "",
  });

  const categorySuggestions = useMemo(() => {
    const ranked = [...categorySuggestionsQuery.categories].sort((left, right) => {
      const countDiff = (right.postCount ?? 0) - (left.postCount ?? 0);
      if (countDiff !== 0) {
        return countDiff;
      }

      const depthDiff = left.depth - right.depth;
      if (depthDiff !== 0) {
        return depthDiff;
      }

      return left.path.localeCompare(right.path);
    });

    return ranked.map((category) => category.path);
  }, [categorySuggestionsQuery.categories]);

  const allTagsQuery = useTags([], { fetchAll: true });

  const tagSuggestions = useMemo(
    () => allTagsQuery.tags.map((tag) => tag.name),
    [allTagsQuery.tags],
  );

  const publishFlow = usePublishFlow({
    user,
    draftId,
    postId,
    draftDetailHasError: draftBootstrap.detailHasError,
    queryClient,
    draftCountQueryKey,
    validateRequiredFields: form.validateRequiredFields,
    buildPostPayload: form.buildPostPayload,
    clearEditorState: form.clearEditorState,
    clearLocalDraftSnapshot: clearLocalSnapshot,
    setTitle: form.setTitle,
    setContent: form.setContent,
    setTags: form.setTags,
    setTagInput: form.setTagInput,
    setError: form.setError,
    setSuccess: form.setSuccess,
    setAutoSaveNotice: form.setAutoSaveNotice,
    setFieldErrors: form.setFieldErrors,
    setIsAuthExpiredModalOpen: form.setIsAuthExpiredModalOpen,
    setIsPublishModalOpen: form.setIsPublishModalOpen,
  });

  useAutoSave({
    enabled: !isPostEditMode,
    user,
    draftId,
    draftDetailError: draftBootstrap.detailHasError,
    title: form.title,
    content: form.content,
    categoryPath: form.categoryPath,
    tags: form.tags,
    thumbnailAttachmentId: form.thumbnailAttachmentId,
    contentFingerprint: form.contentFingerprint,
    buildPostPayload: form.buildPostPayload,
    writeLocalDraftSnapshot: writeLocalSnapshot,
    clearLocalDraftSnapshot: clearLocalSnapshot,
    setAutoSaveNotice: form.setAutoSaveNotice,
    queryClient,
    draftCountQueryKey,
    router,
  });

  const isPublishActionDisabled =
    publishFlow.isSubmitting ||
    imageUpload.isUploading ||
    thumbnail.isThumbnailUploading ||
    draftBootstrap.isDraftLoading ||
    Boolean(draftBootstrap.draftErrorMessage) ||
    form.isAuthExpiredModalOpen;

  if (!user && !isUserLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-5 pb-28 md:px-5 md:py-6 md:pb-32 xl:px-0 xl:py-0">
      <div className="mx-auto max-w-[1880px] xl:max-w-none">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!publishFlow.isSubmitting) {
              publishFlow.openPublishModal();
            }
          }}
          className="pb-8 xl:pb-0"
        >
          <WriteEditorPreview
            content={form.content}
            fieldErrors={form.fieldErrors}
            editorHeader={
              <div className="space-y-5 pt-0 xl:pt-5">
                <WriteFormFields
                  title={form.title}
                  categoryPath={form.categoryPath}
                  categorySuggestions={categorySuggestions}
                  tagInput={form.tagInput}
                  tagSuggestions={tagSuggestions}
                  tags={form.tags}
                  hasThumbnail={Boolean(form.thumbnailPreviewUrl || form.thumbnailAttachmentId)}
                  isThumbnailUploading={thumbnail.isThumbnailUploading}
                  thumbnailUploadError={thumbnail.thumbnailUploadError}
                  fieldErrors={form.fieldErrors}
                  setTitle={form.setTitle}
                  setCategoryPath={form.setCategoryPath}
                  setTagInput={form.setTagInput}
                  setFieldErrors={form.setFieldErrors}
                  handleAddTag={form.handleAddTag}
                  handleRemoveTag={form.handleRemoveTag}
                  handleUploadThumbnail={thumbnail.handleUploadThumbnail}
                />

                {draftBootstrap.draftErrorMessage && (
                  <div className="rounded-2xl bg-[#fee] p-4 text-sm font-medium text-[#c33] ring-1 ring-[#fcc]">
                    {draftBootstrap.draftErrorMessage}
                  </div>
                )}
                {form.error &&
                  !(form.fieldErrors.title || form.fieldErrors.content || form.fieldErrors.category) && (
                    <div className="rounded-2xl bg-[#fee] p-4 text-sm font-medium text-[#c33] ring-1 ring-[#fcc]">
                      {form.error}
                    </div>
                  )}
                {form.success && (
                  <div className="rounded-2xl bg-[#efe] p-4 text-sm font-medium text-[#3c3] ring-1 ring-[#cfc]">
                    {form.success}
                  </div>
                )}
              </div>
            }
            setContent={form.setContent}
            setFieldErrors={form.setFieldErrors}
            isUploading={imageUpload.isUploading}
            uploadError={imageUpload.uploadError}
            onUploadImages={imageUpload.uploadImages}
            onClearUploadError={imageUpload.clearUploadError}
          />

        </form>

        <div className="fixed inset-x-0 bottom-0 z-40 bg-background/96 shadow-[0_-8px_18px_rgba(15,23,42,0.06)] backdrop-blur-sm xl:right-auto xl:w-1/2 dark:shadow-[0_-8px_18px_rgba(0,0,0,0.22)]">
          <div className="px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-6 xl:px-8">
            <WriteActions
              isSubmitting={publishFlow.isSubmitting}
              isPublishActionDisabled={isPublishActionDisabled}
              draftCountLabel={draftBootstrap.draftCountLabel}
              showDraftActions={!isPostEditMode}
              onGoBack={() => router.push("/?mode=user")}
              onSaveDraft={() => void publishFlow.handleSubmit("DRAFT")}
              onOpenPublishModal={publishFlow.openPublishModal}
              onGoDraftList={() => router.push("/post/drafts")}
            />
          </div>
        </div>

        <PublishScopeModal
          isOpen={form.isPublishModalOpen}
          isDisabled={isPublishActionDisabled}
          onClose={() => form.setIsPublishModalOpen(false)}
          onPublishPublic={() => {
            form.setIsPublishModalOpen(false);
            void publishFlow.handleSubmit("PUBLISHED");
          }}
          onPublishPrivate={() => {
            form.setIsPublishModalOpen(false);
            void publishFlow.handleSubmit("PRIVATE");
          }}
        />

        <AuthExpiredModal
          isOpen={form.isAuthExpiredModalOpen}
          onClose={() => {
            clearPendingPublishSnapshot();
            form.setIsAuthExpiredModalOpen(false);
          }}
          onGoToLogin={publishFlow.handleGoToLogin}
        />
      </div>
    </div>
  );
}

export default function WritePostPage() {
  return (
    <Suspense fallback={null}>
      <WritePostPageContent />
    </Suspense>
  );
}
