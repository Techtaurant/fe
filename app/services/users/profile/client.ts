import { UpdateMyProfileRequest, UpdateMyProfileResponse } from "@/app/types";
import { httpClient } from "@/app/utils/httpClient";

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

  if (response.status === 400) {
    const body = (await response.json().catch(() => null)) as UpdateMyProfileResponse | null;
    throw new Error(body?.message || "BAD_REQUEST");
  }

  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }

  return (await response.json()) as UpdateMyProfileResponse;
}
