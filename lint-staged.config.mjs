/**
 * @type {import('lint-staged').Configuration}
 */
const lintStagedConfig = {
  '**/*.{js,ts,jsx,tsx,mjs,mts}': ['eslint --fix', 'prettier --write'],
  '**/*.{css,json,yml,md}': ['prettier --write'],
};

export default lintStagedConfig;
