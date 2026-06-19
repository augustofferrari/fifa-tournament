import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname)

export default defineConfig({
  resolve: {
    alias: {
      '@shared': resolve(root, 'src/shared'),
      '@database': resolve(root, 'src/database/index.ts'),
      '@modules': resolve(root, 'src/modules'),
    },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
})
