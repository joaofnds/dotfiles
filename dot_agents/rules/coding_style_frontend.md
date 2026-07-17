# Frontend Coding Style

Stack-specific conventions for building UI. Read the generic `coding_style.md` and `coding_style_typescript.md` first; this file is the UI layer on top of them. Framework-agnostic by default — primary stack is **Next.js + Tailwind**, secondary is **Tauri + Svelte**. When a rule is framework-specific it says so.

Taste and aesthetic direction live in the `frontend-design` skill — it fires on its own. This file is the always-on convention floor underneath it.

## 1. Tokens Are the Single Source of Truth

- **Reusable visual values come from the scale.** Color, spacing, type, radius, shadow, and z-index use Tailwind theme tokens or CSS custom properties.
- **Add semantic tokens for reusable roles.** A brand color or repeated radius belongs in `tailwind.config` / `:root`; do not add a global token for local geometry with no reusable meaning.
- **Arbitrary values need a local reason.** Computed transforms and one-off grid geometry may use `[...]`. Repetition is evidence that the value should become a token.
- **Semantic tokens over raw ones at the call site.** Reference `bg-surface` / `text-muted` / `border-default`, not `bg-zinc-900`. The raw scale defines values once; semantic tokens map them to roles so a theme change is one edit, not a find-and-replace.

## 2. Spacing

- **One spacing scale, used consistently.** Margins, padding, and gaps come from the Tailwind spacing scale. No arbitrary values between sections — section rhythm is the most visible place inconsistency leaks in.
- **Prefer layout primitives over per-element margins.** `flex`/`grid` with `gap-*` over stacking `mt-*` on children. Owning the gap at the container removes the margin-collapse and double-spacing bugs.
- **Watch for utilities that cancel each other out.** A type-level selector and an element-level selector fighting over the same padding (the classic `.section` vs `.cta` collision) produces spacing that depends on source order. Resolve it at one layer; don't stack overrides.

## 3. Type

- **A defined type scale, not ad-hoc sizes.** Sizes, weights, and line-heights come from the scale. Each step pairs a size with an intentional line-height — body copy breathes, display is tight. No arbitrary `text-[15px]`/`leading-[1.3]`.
- **Display and body are distinct roles.** Distinguish them deliberately — family, weight, tracking — and apply each to its role consistently. Headings aren't just "body but bigger."
- **Weights are chosen, not defaulted.** Pick the weights the design uses and stick to them. Don't reach for `font-bold` reflexively where the scale calls for `font-medium`.

## 4. Icons

- **One icon set per project.** Consistent size and stroke weight across the whole UI. Mixing sets (or sizes, or stroke weights) reads as unfinished immediately.
- **Preserve the project's icon set.** For a greenfield Next or Svelte UI with no established icon system, prefer `lucide-react` or `@lucide/svelte`. The old `lucide-svelte` package is deprecated; `@lucide/svelte` is the Svelte 5 successor.

## 5. Component Primitives

- **Compose from a real component layer; don't hand-roll every element.** Buttons, inputs, dialogs, menus, tooltips come from a primitives layer with accessibility and keyboard behavior already solved. Re-implementing them per feature is where bugs and inconsistency breed.
- **Use the project's accessible component layer.** For a greenfield Next or Svelte UI without one, prefer `shadcn/ui` or `shadcn-svelte`. Drop to their headless primitives only for behavior the styled layer does not cover.
- **Own the copied components, then extend.** shadcn/ui and shadcn-svelte copy code into the repo — that copy is ours to edit (the headless layers underneath are installed packages, left as-is). Adjust the copied component to fit the token system once; don't override it ad-hoc at each call site.

## 6. Accessibility Floor (Non-Negotiable)

- **Semantic HTML first.** A `<button>` is a button, a `<nav>` is a nav, a heading hierarchy is real. `<div onClick>` is a defect — it loses focus, keyboard, and assistive-tech behavior you'd then re-implement worse.
- **Every control has an accessible name.** A visible `<label>` for form controls; an `aria-label` for icon-only buttons. Semantics aren't enough — a `<button>` whose only child is an icon has an empty accessible name and is invisible to screen readers.
- **Visible keyboard focus.** Every interactive element is reachable and operable by keyboard with a visible focus indicator. Never `outline: none` without a replacement.
- **`prefers-reduced-motion` respected.** Gate non-essential animation behind it. Motion is an enhancement, never a requirement for using the UI.
- **Color is never the sole carrier of meaning.** Pair it with text, icon, or shape — state, validation, and categories must survive color blindness and grayscale.
- **Hit targets sized for touch.** Interactive targets are comfortably tappable (~44px) with adequate spacing; don't ship desktop-only click areas.

## 7. Responsive

- **Mobile-first.** Base styles target small screens; layer up with min-width breakpoints (`sm:`/`md:`/`lg:`). Don't author desktop-first and patch downward.
- **Use the defined breakpoints.** Stick to the theme's breakpoint scale; don't invent one-off widths per component.
- **Test narrow widths.** A layout isn't done until it holds at ~320px. Narrow is where overflow, truncation, and spacing collapse surface.

## 8. Framework-Specific

- **Next — be deliberate about server vs client components.** Default to server components; reach for `'use client'` only where interactivity or browser APIs demand it. Keep client boundaries small and pushed to the leaves — a `'use client'` boundary pulls everything it *imports* into the client bundle, though server components passed in via `children`/props still render on the server.
- **Svelte / Tauri — favor lightweight, native-feeling UI.** Mind bundle size; prefer Svelte's built-in reactivity and transitions over heavy dependencies. Account for webview platform quirks (font rendering, scroll behavior, drag regions, safe areas) — it's a real browser engine with per-OS differences, not a fixed target.
