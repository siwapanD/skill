import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      // No `any` — the #1 way type safety silently disappears. Use `unknown` +
      // a type guard/Zod parse, or a precise type, instead. If you genuinely
      // need an escape hatch, disable the line explicitly with a reason:
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any -- <why>
      "@typescript-eslint/no-explicit-any": "error",

      // Unused vars are almost always a leftover from a refactor. Allow a
      // leading-underscore escape hatch for intentionally-unused params
      // (e.g. required by an interface signature).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],

      // `!foo` non-null assertions bypass the type checker exactly like `any`
      // does — prefer a real null check or optional chaining.
      "@typescript-eslint/no-non-null-assertion": "warn",

      // console.log left in server/client code is a debugging leftover;
      // console.warn/error are legitimate (predev-check.mjs, error boundaries).
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Prevent `==`/`!=` foot-guns; `== null` is still allowed (common,
      // intentional null-or-undefined check).
      eqeqeq: ["error", "always", { null: "ignore" }],

      // let that's never reassigned should be const — makes intent explicit.
      "prefer-const": "error",
    },
  },

  {
    // Node scripts (predev-check.mjs, hooks) legitimately use console for
    // human-readable CLI output — don't flag them.
    files: ["scripts/**/*.mjs", ".claude/hooks/**/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];

export default eslintConfig;
