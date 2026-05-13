import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|open-api|oauth2|_next|_vercel|.*\\..*).*)"],
};
