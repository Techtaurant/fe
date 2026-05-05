import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { uploadPostImages } from "../../services/attachments";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function usePostImageUpload() {
  const tError = useTranslations("WritePage.errors");

  const mutation = useMutation({
    mutationFn: async (files: File[]) => {
      const imageFiles = files.filter(isImageFile);

      if (imageFiles.length === 0) {
        throw new Error("INVALID_IMAGE_TYPE");
      }

      return uploadPostImages(imageFiles);
    },
  });

  const uploadError = (() => {
    if (!mutation.error) return null;

    const message = mutation.error instanceof Error ? mutation.error.message : "UNKNOWN";

    if (message === "INVALID_IMAGE_TYPE") {
      return tError("invalidImageType");
    }

    if (message === "UNAUTHORIZED") {
      return tError("unauthorized");
    }

    if (message === "BAD_REQUEST") {
      return tError("badRequest");
    }

    if (message.startsWith("HTTP_") || message.startsWith("UPLOAD_")) {
      return tError("imageUploadFailed");
    }

    return tError("imageUploadFailed");
  })();

  return {
    uploadImages: mutation.mutateAsync,
    clearUploadError: mutation.reset,
    isUploading: mutation.isPending,
    uploadError,
  };
}
