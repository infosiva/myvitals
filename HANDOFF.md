

## OWASP LLM Top 10 dispositions (gate item 45, 2026-10-07; list recalled from memory, unverified)
- LLM01 prompt injection: lib/guard.ts present, NOT yet wired into routes; no output filtering or tool sandbox review done. PARTIAL.
- LLM02 sensitive info disclosure: `redact()` helper available; not applied to every log. PARTIAL.
- LLM04/10 DoS / unbounded consumption: per-IP rate limit where present; token budgets not enforced. PARTIAL.
- LLM05 improper output handling: model output rendered as text; not audited for HTML sinks. UNVERIFIED.
- LLM06 excessive agency: no tool-calling agents audited. UNVERIFIED.
- Others (supply chain, poisoning, embeddings, misinformation): not assessed.


## ANIMATED SCOPE (gate items 19/21, derived from code 2026-10-07)
- Moves: AnimatedBg (ambient hero/background); CSS keyframes: bgGradientShift, dhi-count, ds-float, ds-shift, fadeIn, float, fw-spin, gateSlideUp; transitions on interactive elements.
- Trigger: page load (ambient) and hover/press (interactive). Reduced motion: honoured via prefers-reduced-motion block.
- STATUS: scope documented from existing code only. Skill-stack passes (ui-ux-pro-max, emil-design-eng, impeccable critique, review-animations) and 375/1280 screenshot review are NOT yet run for this app. Item 21 stays OPEN until they are.

## Item 21 visual pass (2026-10-07)
Files changed: components/CookieConsent.tsx, components/Footer.tsx, components/AnimatedHeroGuide.tsx, components/FeedbackWidget.tsx, components/AuthButton.tsx, app/MyVitalsPage.tsx, app/globals.css (cookie banner restyle, 44px targets everywhere, footer/subtext contrast, press feedback, reduced-motion, mobile nav fix).
Verified: 375+1280 screenshots read after last edit, no horizontal overflow, 0 interactive targets under 44px.
Caveat: contrast set by token choice (#475569 on light, rgba>=0.6 white on dark), not ratio-measured per node; mobile bottom tab bar hidden behind cookie banner until consent.
SKILL-STACK: done
