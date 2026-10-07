# DESIGN — MyVitals
Source of truth: `agents/design-system` (MASTER.md). This file is the project pointer.

- Accent: `#0d9488` on bg `#f0fdfa` (light, teal)
- Layout/palette/bg animation/GA4/flags: overridable by the hub via Edge Config `theme_myvitals` (loaded by `lib/theme-loader.ts`, applied in `app/layout.tsx`); hub values win over the defaults here.
- Background: `components/AnimatedBg.tsx` (hub `layout.bgAnimation`, reduced-motion safe, default `none` = unchanged look).
- Logo: `components/Logo.tsx`; favicon is a static icon (no `app/icon.tsx`).

## AI platform (ai-core) status
Not on ai-core yet (honest gap): insights/coach/chat use the local free chain (`lib/ai.ts`). Health logs are user data; no RAG/doc upload in scope, so exempt for now. Any future upload goes through ai-core server-side only.
