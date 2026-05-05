import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildQueryString(params: Record<string, string | string[] | undefined>) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
      return;
    }

    if (typeof value === "string") {
      query.set(key, value);
    }
  });

  return query.toString();
}

export default async function OAuthErrorRedirect({ searchParams }: Props) {
  const params = await searchParams;
  const query = buildQueryString(params);
  const target = `/${routing.defaultLocale}/oauth/error${query ? `?${query}` : ""}`;

  redirect(target);
}
