import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.html",
    // Build artifacts and generated code
    "ios/**",
    "android/**",
    "public/sw.js",
  ]),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }]
    }
  },
  {
    // Immutable byte-for-byte production fixture; linting must not require
    // renaming variables and invalidating its locked SHA-256 provenance.
    files: ["__tests__/fixtures/service-worker-v1.0.0-22dbdfa.js"],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off'
    }
  }
]);

export default eslintConfig;
