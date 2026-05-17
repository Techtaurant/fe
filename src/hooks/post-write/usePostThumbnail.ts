import { useCallback, useEffect, useRef } from "react";
import { fetchAttachmentPreviewUrl } from "../../services/attachments";
import { usePostThumbnailUpload } from "./usePostThumbnailUpload";

interface UsePostThumbnailParams {
  thumbnailAttachmentId: string | null;
  thumbnailPreviewUrl: string | null;
  setThumbnailAttachmentId: (value: string | null) => void;
  setThumbnailPreviewUrl: (value: string | null) => void;
}

export function usePostThumbnail({
  thumbnailAttachmentId,
  thumbnailPreviewUrl,
  setThumbnailAttachmentId,
  setThumbnailPreviewUrl,
}: UsePostThumbnailParams) {
  const thumbnailObjectUrlRef = useRef<string | null>(null);
  const upload = usePostThumbnailUpload();

  const replaceThumbnailPreviewUrl = useCallback(
    (nextPreviewUrl: string | null) => {
      if (
        thumbnailObjectUrlRef.current &&
        thumbnailObjectUrlRef.current !== nextPreviewUrl &&
        thumbnailObjectUrlRef.current.startsWith("blob:")
      ) {
        URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      }

      thumbnailObjectUrlRef.current = nextPreviewUrl?.startsWith("blob:") ? nextPreviewUrl : null;
      setThumbnailPreviewUrl(nextPreviewUrl);
    },
    [setThumbnailPreviewUrl],
  );

  useEffect(
    () => () => {
      if (thumbnailObjectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!thumbnailAttachmentId) {
      replaceThumbnailPreviewUrl(null);
      return;
    }

    if (thumbnailPreviewUrl) {
      return;
    }

    let isCancelled = false;

    void fetchAttachmentPreviewUrl(thumbnailAttachmentId)
      .then((previewUrl) => {
        if (!isCancelled) {
          replaceThumbnailPreviewUrl(previewUrl);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          replaceThumbnailPreviewUrl(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [thumbnailAttachmentId, thumbnailPreviewUrl, replaceThumbnailPreviewUrl]);

  const handleUploadThumbnail = useCallback(
    async (file: File) => {
      upload.clearThumbnailUploadError();
      const uploadedThumbnail = await upload.uploadThumbnail(file);
      setThumbnailAttachmentId(uploadedThumbnail.attachmentId);
      replaceThumbnailPreviewUrl(uploadedThumbnail.previewUrl ?? null);
    },
    [replaceThumbnailPreviewUrl, setThumbnailAttachmentId, upload],
  );

  const handleRemoveThumbnail = useCallback(() => {
    upload.clearThumbnailUploadError();
    setThumbnailAttachmentId(null);
    replaceThumbnailPreviewUrl(null);
  }, [replaceThumbnailPreviewUrl, setThumbnailAttachmentId, upload]);

  const clearThumbnailPreview = useCallback(() => {
    replaceThumbnailPreviewUrl(null);
  }, [replaceThumbnailPreviewUrl]);

  return {
    isThumbnailUploading: upload.isThumbnailUploading,
    thumbnailUploadError: upload.thumbnailUploadError,
    clearThumbnailPreview,
    handleUploadThumbnail,
    handleRemoveThumbnail,
  };
}
