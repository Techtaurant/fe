"use client";

import { Suspense, useEffect } from "react";
import type { KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
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
  const { setError, setSuccess } = form;

  const draftBootstrap = useDraftBootstrap({
    draftId,
    postId,
    draftCountQueryKey,
    setTitle: form.setTitle,
    setContent: form.setContent,
    setCategoryPath: form.setCategoryPath,
    setTags: form.setTags,
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

  useAutoSave({
    enabled: !isPostEditMode,
    user,
    draftId,
    draftDetailError: draftBootstrap.detailHasError,
    title: form.title,
    content: form.content,
    categoryPath: form.categoryPath,
    tags: form.tags,
    contentFingerprint: form.contentFingerprint,
    buildPostPayload: form.buildPostPayload,
    writeLocalDraftSnapshot: writeLocalSnapshot,
    clearLocalDraftSnapshot: clearLocalSnapshot,
    setAutoSaveNotice: form.setAutoSaveNotice,
    queryClient,
    draftCountQueryKey,
    router,
  });

  useSessionPrecheck({
    user,
    hasEditableContent: form.hasEditableContent,
    isAuthExpiredModalOpen: form.isAuthExpiredModalOpen,
    contentFingerprint: form.contentFingerprint,
    onAuthExpired: openAuthExpiredModal,
  });

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

  const isPublishActionDisabled =
    publishFlow.isSubmitting ||
    draftBootstrap.isDraftLoading ||
    Boolean(draftBootstrap.draftErrorMessage) ||
    form.isAuthExpiredModalOpen;

  const handleTagKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      form.handleAddTag();
    }
  };

  if (!user && !isUserLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-3 py-4 pb-28 md:px-4 md:py-6 md:pb-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
            {draftId || postId ? t("mode.edit") : t("mode.create")}
          </p>
        </div>

        {draftBootstrap.isDraftLoading && (
          <div className="mb-4 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            {t("loadingDraft")}
          </div>
        )}

        {draftBootstrap.draftErrorMessage && (
          <div className="mb-4 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
            {draftBootstrap.draftErrorMessage}
          </div>
        )}

        {form.autoSaveNotice && (
          <div className="mb-4 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            {form.autoSaveNotice}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!publishFlow.isSubmitting) {
              publishFlow.openPublishModal();
            }
          }}
          className="rounded-lg bg-card p-4 shadow-sm md:rounded-xl md:p-6 lg:p-8"
        >
          <WriteFormFields
            title={form.title}
            categoryPath={form.categoryPath}
            tagInput={form.tagInput}
            tags={form.tags}
            fieldErrors={form.fieldErrors}
            setTitle={form.setTitle}
            setCategoryPath={form.setCategoryPath}
            setTagInput={form.setTagInput}
            setFieldErrors={form.setFieldErrors}
            handleTagKeyPress={handleTagKeyPress}
            handleRemoveTag={form.handleRemoveTag}
          />

          {form.error && !(form.fieldErrors.title || form.fieldErrors.content || form.fieldErrors.category) && (
            <div className="mb-6 rounded-lg border border-[#fcc] bg-[#fee] p-4 text-sm font-medium text-[#c33]">
              {form.error}
            </div>
          )}
          {form.success && (
            <div className="mb-6 rounded-lg border border-[#cfc] bg-[#efe] p-4 text-sm font-medium text-[#3c3]">
              {form.success}
            </div>
          )}

          <WriteEditorPreview
            content={form.content}
            fieldErrors={form.fieldErrors}
            setContent={form.setContent}
            setFieldErrors={form.setFieldErrors}
          />

        </form>

        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-[1400px] px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:px-4">
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
