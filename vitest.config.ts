import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['packages/**/*.test.{ts,mjs,js}'],
    exclude: ['**/node_modules/**'],
  },
})
