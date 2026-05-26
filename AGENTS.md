# Life Game — Project Guide

## Rules

- **Never** run `npm` commands outside Docker container — use `make dev` / `make build` instead
- **Never** run `npm run build` or `npx nuxi typecheck` unless explicitly asked — dev mode hot-reload handles changes
- **Never** commit or create PRs without explicit user approval
- **Never** force-push, amend commits, or rewrite git history

## Stack

- **Framework:** Nuxt 4 (compat), Vue 3, TypeScript 6
- **Styling:** Tailwind CSS 4 (`@nuxtjs/tailwindcss`, `@tailwindcss/vite`)
- **Modules:** color-mode, i18n, vueuse, motion-v, nuxt/icon, nuxt/fonts
- **Package manager:** npm

## Commands

| Command | Description |
|---|---|
| `make dev` | Start dev server (Docker) |
| `make build` | Build Docker image |
| `make down` | Stop Docker container |
| `make run cmd="<script>"` | Run any npm script inside container |
| `make run cmd="npm run generate"` | Static site generation |
| `make run cmd="npm run preview"` | Preview production build |
| `make run cmd="npx nuxt prepare"` | Generate Nuxt types |

## Code conventions

- **TypeScript** everywhere, strict mode
- **Prettier** with `@ianvs/prettier-plugin-sort-imports` and `prettier-plugin-tailwindcss`
  - `printWidth: 100`, `semi: true`, `singleQuote: false`, `tabWidth: 2`, `trailingComma: "es5"`
  - Imports order: builtin → third-party → types → relative
  - Tailwind functions: `tv`, `tw`
- **ESLint** via Nuxt config + `eslint-config-prettier`
  - `no-explicit-any`: warn
  - `no-unused-vars`: error (allow `_` prefix)
  - `vue/multi-word-component-names`: off
- Use `tv()` from `tailwind-variants` for component variants
- Use `tw` tagged template for Tailwind class combinations

## Project structure

```
app/
  app.vue           # Root — Html, NuxtLayout, NuxtPage
  layouts/          # default.vue
  pages/            # Route pages
  components/       # Global auto-imported components
  assets/css/       # main.css (CSS variables, Tailwind utilities)
  utils/            # Auto-imported utilities
public/             # Static files
i18n/               # Translation files (en.json, ru.json)
```
