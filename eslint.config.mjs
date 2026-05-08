import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const noRestrictedImports = {
  files: ["**/*.{js,mjs,cjs,ts,tsx,jsx}"],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "next/link",
            message: "'@/i18n/navigation'의 Link를 사용하세요.",
          },
          {
            name: "next/router",
            message: "'@/i18n/navigation'의 내비게이션 유틸을 사용하세요.",
          },
          {
            name: "next/navigation",
            importNames: ["redirect", "permanentRedirect", "usePathname", "useRouter", "getPathname"],
            message: "'@/i18n/navigation'의 내비게이션 유틸을 사용하세요.",
          },
        ],
      },
    ],
  },
};

const importSortConfig = {
  files: ["**/*.{js,jsx,ts,tsx,mjs,mts}"],
  plugins: {
    "simple-import-sort": simpleImportSort,
  },
  rules: {
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  noRestrictedImports,
  importSortConfig,
  prettierConfig,
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
