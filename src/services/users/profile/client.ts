import { UpdateMyProfileRequest, UpdateMyProfileResponse } from "../../../types";
import { httpClient } from "../../../utils/httpClient";

interface ProfileErrorResponse {
  status?: number;
  message?: string;
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json();
}

function toProfileErrorResponse(value: unknown): ProfileErrorResponse | null {
  if (typeof value !== "object" || value === null) return null;

  const body = value as { status?: unknown; message?: unknown };
  return {
    status: typeof body.status === "number" ? body.status : undefined,
    message: typeof body.message === "string" ? body.message : undefined,
  };
}

export async function updateMyProfileRequest(
  payload: UpdateMyProfileRequest,
): Promise<UpdateMyProfileResponse> {
  const response = await httpClient("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (response.status === 401) {
    throw new Error("UNAUTHORIZED");
  }

  if (response.status === 409) {
    const body = toProfileErrorResponse(await parseJson(response).catch(() => null));

    if (body?.status === 1009) {
      throw new Error("DUPLICATE_NAME");
    }

    throw new Error(`HTTP_${response.status}`);
  }

  if (response.status === 400) {
    const body = toProfileErrorResponse(await parseJson(response).catch(() => null));
    throw new Error(body?.message || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as UpdateMyProfileResponse;
}
