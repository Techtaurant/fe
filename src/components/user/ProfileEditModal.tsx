"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, LoaderCircle, PencilLine, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { uploadProfileImages } from "../../services/attachments";
import { queryKeys } from "../../lib/queryKeys";
import { updateMyProfileRequest } from "../../services/users/profile";
import { User } from "../../types";
import AppModal from "../common/AppModal";
import PrimaryRectButton from "../ui/PrimaryRectButton";

interface ProfileEditModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export default function ProfileEditModal({ isOpen, user, onClose }: ProfileEditModalProps) {
  const t = useTranslations("UserPage.profileEdit");
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [nameErrorMessage, setNameErrorMessage] = useState<string | null>(null);
  const [generalErrorMessage, setGeneralErrorMessage] = useState<string | null>(null);

  const previewUrl = useMemo(
    () => (selectedFile ? URL.createObjectURL(selectedFile) : user.profileImageUrl || ""),
    [selectedFile, user.profileImageUrl],
  );

  useEffect(() => {
    if (!selectedFile || !previewUrl) {
      return;
    }

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl, selectedFile]);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("EMPTY_NAME");
      }

      const uploadedImage = selectedFile
        ? await uploadProfileImages([selectedFile]).then((files) => files[0])
        : null;

      return updateMyProfileRequest({
        name: trimmedName,
        ...(uploadedImage?.attachmentId
          ? { serviceProfileImageAttachmentId: uploadedImage.attachmentId }
          : {}),
      });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.user.me(), {
        ...user,
        name: result.data.name,
        email: result.data.email,
        profileImageUrl: result.data.profileImageUrl ?? "",
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.user.me() });
      onClose();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "UNKNOWN";

      if (message === "EMPTY_NAME") {
        setNameErrorMessage(t("errors.emptyName"));
        return;
      }

      if (message === "DUPLICATE_NAME") {
        setNameErrorMessage(t("errors.duplicateName"));
        return;
      }

      if (message === "UNAUTHORIZED") {
        setGeneralErrorMessage(t("errors.unauthorized"));
        return;
      }

      if (message === "BAD_REQUEST") {
        setGeneralErrorMessage(t("errors.badRequest"));
        return;
      }

      if (message.startsWith("UPLOAD_")) {
        setGeneralErrorMessage(t("errors.uploadFailed"));
        return;
      }

      if (message.startsWith("HTTP_")) {
        setGeneralErrorMessage(t("errors.http", { code: message.replace("HTTP_", "") }));
        return;
      }

      setGeneralErrorMessage(t("errors.saveFailed"));
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setGeneralErrorMessage(t("errors.invalidImageType"));
      return;
    }

    setSelectedFile(file);
    setGeneralErrorMessage(null);
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={() => {
        if (updateProfileMutation.isPending) {
          return;
        }
        onClose();
      }}
      panelClassName="w-full max-w-[560px]"
    >
      <div className="overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={updateProfileMutation.isPending}
            aria-label={t("closeAria")}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          <section className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-4 py-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-full bg-muted">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={name || user.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                  {(name.trim() || user.name || "?").charAt(0)}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={updateProfileMutation.isPending}
                aria-label={t("imageAction")}
                className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-transform hover:scale-[1.03] disabled:opacity-60"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">{t("imageTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("imageDescription")}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={updateProfileMutation.isPending}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
            >
              <PencilLine className="h-4 w-4" />
              {t("changeImage")}
            </button>
          </section>

          <section>
            <label htmlFor="profile-edit-name" className="mb-2 block text-sm font-semibold text-foreground">
              {t("nameLabel")}
            </label>
            <input
              id="profile-edit-name"
              type="text"
              value={name}
              maxLength={20}
              onChange={(event) => {
                setName(event.target.value);
                setNameErrorMessage(null);
                setGeneralErrorMessage(null);
              }}
              disabled={updateProfileMutation.isPending}
              placeholder={t("namePlaceholder")}
              className={`h-12 w-full rounded-2xl border bg-background px-4 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${
                nameErrorMessage ? "border-red-500" : "border-border"
              }`}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className={`text-xs ${nameErrorMessage ? "text-red-600" : "text-muted-foreground"}`}>
                {nameErrorMessage || t("nameHint")}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{name.trim().length}/20</p>
            </div>
          </section>

          {generalErrorMessage ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10">
              {generalErrorMessage}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={updateProfileMutation.isPending}
            className="btn-rect btn-neutral-surface inline-flex h-11 w-full items-center justify-center px-4 text-sm font-semibold text-muted-foreground disabled:opacity-60"
          >
            {t("cancel")}
          </button>
          <PrimaryRectButton
            onClick={() => {
              setNameErrorMessage(null);
              setGeneralErrorMessage(null);
              updateProfileMutation.mutate();
            }}
            disabled={updateProfileMutation.isPending}
            className="h-11 w-full px-4 text-sm font-semibold"
          >
            {updateProfileMutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                {t("saving")}
              </span>
            ) : (
              t("save")
            )}
          </PrimaryRectButton>
        </div>
      </div>
    </AppModal>
  );
}
