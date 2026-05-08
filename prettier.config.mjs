/** @type {import("prettier").Config} */
const config = {
  arrowParens: 'always',
  endOfLine: 'lf',
  printWidth: 100,
  proseWrap: 'always',
  quoteProps: 'as-needed',
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  useTabs: false,
  plugins: ['prettier-plugin-tailwindcss'],
};

export default config;
