import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// In some environments, global modules are not automatically resolved in ESM.
// This helper tries to load typescript-eslint from the global npm root if local fails.
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
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
];
