import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Try to load typescript-eslint from the global npm root if local fails.
let tseslint;
try {
  tseslint = require('typescript-eslint');
} catch (e) {
  const { execSync } = require('child_process');
  const npmRoot = execSync('npm root -g').toString().trim();
  tseslint = require(`${npmRoot}/typescript-eslint`);
}

export default [
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off',
    },
  },
];
