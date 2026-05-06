import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noRestrictedImports = {
  files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
  rules: {
    "no-restricted-imports": [
      "warn",
      {
        paths: [
          {
            name: "next/link",
            message: "'@/i18n/navigation'의 Link를 사용하세요.",
          },
          {
            name: "next/navigation",
            importNames: ["redirect", "usePathname", "useRouter", "getPathname"],
            message: "'@/i18n/navigation'의 내비게이션 유틸을 사용하세요.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noRestrictedImports,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
