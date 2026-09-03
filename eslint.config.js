import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Nada de lintear código compilado ni carpetas de plataforma nativa: son
  // bundles generados, no fuente nuestra, y disparaban cientos de falsos avisos.
  globalIgnores(['dist', 'android', 'ios', 'docs', 'scratch', 'public']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        // Los servicios de IA llevan un fallback guardado a process.env para
        // poder ejecutarse y validarse fuera del navegador.
        process: 'readonly'
      },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Las interfaces declaran su contrato con parámetros con nombre: eso es
    // documentación, no código muerto. Que el cuerpo lance «not implemented»
    // no hace que los parámetros sobren.
    files: ['src/**/I*.js'],
    rules: {
      'no-unused-vars': ['error', { args: 'none' }]
    },
  },
])
