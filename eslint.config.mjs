import { generateEslintConfig } from '@companion-module/tools/eslint/config.mjs'

const baseConfig = await generateEslintConfig({ enableTypescript: true })

/** @type {import('eslint').Linter.Config[]} */
const customConfig = [
	{
		// Scope type-aware linting to TypeScript files only
		files: ['**/*.ts'],
		languageOptions: {
			parserOptions: {
				project: './tsconfig.eslint.json',
			},
		},
	},
	{
		// Relax rules for test files and vitest config
		files: ['tests/**/*.ts', 'vitest.config.ts'],
		rules: {
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'n/no-unpublished-import': 'off',
		},
	},
]

export default [...baseConfig, ...customConfig]
