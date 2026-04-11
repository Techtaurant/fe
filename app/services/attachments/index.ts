import {
  CreateAttachmentPresignedUrlRequest,
  CreateAttachmentPresignedUrlResponse,
} from "@/app/types";
import { httpClient } from "@/app/utils/httpClient";

export interface UploadedAttachment {
  attachmentId: string;
  fileName: string;
  previewUrl?: string;
}

interface AttachmentPreviewUrlResponse {
  status: number;
  data: {
    attachmentId: string;
    objectKey: string;
    presignedUrl: string;
  };
  message: string;
}

async function createAttachmentPresignedUrl(
  payload: CreateAttachmentPresignedUrlRequest,
): Promise<CreateAttachmentPresignedUrlResponse["data"]> {
  const response = await httpClient("/api/attachments/presigned-url", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status === 400) {
    throw new Error("BAD_REQUEST");
  }

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const body =
    (await response.json()) as CreateAttachmentPresignedUrlResponse;

  return body.data;
}

async function uploadFileToPresignedUrl(
  presignedUrl: string,
  file: File,
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`UPLOAD_${response.status}`);
  }
}

async function uploadFilesByReferenceType(
  files: File[],
  referenceType: CreateAttachmentPresignedUrlRequest["referenceType"],
): Promise<UploadedAttachment[]> {
  return Promise.all(
    files.map(async (file) => {
      const presigned = await createAttachmentPresignedUrl({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        referenceType,
      });

      await uploadFileToPresignedUrl(presigned.presignedUrl, file);

      const previewUrl =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(file)
          : undefined;

      return {
        attachmentId: presigned.attachmentId,
        fileName: file.name,
        previewUrl,
      };
    }),
  );
}

export async function uploadPostImages(files: File[]): Promise<UploadedAttachment[]> {
  return uploadFilesByReferenceType(files, "POST");
}

export async function uploadProfileImages(files: File[]): Promise<UploadedAttachment[]> {
  return uploadFilesByReferenceType(files, "PROFILE");
}

export async function fetchAttachmentPreviewUrl(attachmentId: string): Promise<string> {
  const response = await httpClient(
    `/api/attachments/${encodeURIComponent(attachmentId)}/preview-url`,
    {
      method: "GET",
    },
  );

  if (response.status === 400) {
    throw new Error("BAD_REQUEST");
  }

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  const body = (await response.json()) as AttachmentPreviewUrlResponse;
  return body.data.presignedUrl;
}
