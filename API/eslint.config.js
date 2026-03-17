import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
    js.configs.recommended,
    {
        files: ["**/*.ts"],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                sourceType: "module"
            },
            globals: {
                console: "readonly",
                process: "readonly",
                setTimeout: "readonly",
                fetch: "readonly"
            }
        },
        plugins: {
            "@typescript-eslint": tseslint
        },
        rules: {
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
        }
    },
    {
        ignores: ["node_modules", "dist"]
    }
];
