import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { uploadPostImages } from "../../services/attachments";

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function usePostThumbnailUpload() {
  const tError = useTranslations("WritePage.errors");

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      if (!isImageFile(file)) {
        throw new Error("INVALID_IMAGE_TYPE");
      }

      const [uploadedThumbnail] = await uploadPostImages([file]);

      if (!uploadedThumbnail) {
        throw new Error("UPLOAD_EMPTY");
      }

      return uploadedThumbnail;
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

    return tError("imageUploadFailed");
  })();

  return {
    uploadThumbnail: mutation.mutateAsync,
    clearThumbnailUploadError: mutation.reset,
    isThumbnailUploading: mutation.isPending,
    thumbnailUploadError: uploadError,
  };
}
