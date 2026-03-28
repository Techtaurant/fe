import {
  CreateAttachmentPresignedUrlRequest,
  CreateAttachmentPresignedUrlResponse,
} from "@/app/types";
import { httpClient } from "@/app/utils/httpClient";

export interface UploadedAttachment {
  attachmentId: string;
  fileName: string;
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

export async function uploadPostImages(files: File[]): Promise<UploadedAttachment[]> {
  return Promise.all(
    files.map(async (file) => {
      const presigned = await createAttachmentPresignedUrl({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        fileSize: file.size,
        referenceType: "POST",
      });

      await uploadFileToPresignedUrl(presigned.presignedUrl, file);

      return {
        attachmentId: presigned.attachmentId,
        fileName: file.name,
      };
    }),
  );
}
