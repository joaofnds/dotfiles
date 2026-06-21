# Frontend Coding Style

Stack-specific conventions for building UI. Read the generic `coding_style.md` and `coding_style_typescript.md` first; this file is the UI layer on top of them. Framework-agnostic by default — primary stack is **Next.js + Tailwind**, secondary is **Tauri + Svelte**. When a rule is framework-specific it says so.

Taste and aesthetic direction live in the `frontend-design` skill — it fires on its own. This file is the always-on convention floor underneath it.

## 1. Tokens Are the Single Source of Truth

- **Every visual value comes from the scale.** Color, spacing, type, radius, shadow, z-index — all from the Tailwind theme config (or CSS custom properties when Tailwind isn't the renderer). Never a one-off hex, never an arbitrary `[13px]`, `[#3a3a3a]`, `mt-[7px]`.
- **If a value isn't in the scale, add it to the scale.** A new brand color or a one-off radius is a token-system change — make it in `tailwind.config` / `:root`, name it, then reference the name. Inlining it is the bug; the missing token is the root cause.
- **Arbitrary values are a smell, not a tool.** `[...]` syntax is an escape hatch on par with `as any`: it bypasses the system that keeps the UI coherent. The rare legitimate use (a computed transform, a one-time `grid-template`) gets a reason; everything else is a missing token.
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
- **`lucide-react` for Next, `@lucide/svelte` for Svelte.** Same icon language across both stacks; framework-correct binding for each. The old `lucide-svelte` package is deprecated — `@lucide/svelte` is the Svelte 5 successor.
- **Never mix sets.** If the chosen set lacks an icon, find the closest within it or commission one in the same visual language — don't drop in a foreign set's glyph.

## 5. Component Primitives

- **Compose from a real component layer; don't hand-roll every element.** Buttons, inputs, dialogs, menus, tooltips come from a primitives layer with accessibility and keyboard behavior already solved. Re-implementing them per feature is where bugs and inconsistency breed.
- **`shadcn/ui` for Next; `shadcn-svelte` for Svelte.** Both are styled, copy-in components built on a headless layer (Radix under shadcn/ui; Bits UI → Melt UI under shadcn-svelte). Drop down a layer to those primitives only when you need behavior the styled set doesn't cover. Anchoring every feature to the same primitives is where most layout and spacing consistency actually comes from — more than any style rule.
- **Own the copied components, then extend.** shadcn/ui and shadcn-svelte copy code into the repo — that copy is ours to edit (the headless layers underneath are installed packages, left as-is). Adjust the copied component to fit the token system once; don't override it ad-hoc at each call site.

## 6. Accessibility Floor (Non-Negotiable)

This is the floor, not a feature. Same standing as type safety — not optional, not deferred.

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

Kept brief — the principles above carry the weight; these are the per-stack adjustments.

- **Next — be deliberate about server vs client components.** Default to server components; reach for `'use client'` only where interactivity or browser APIs demand it. Keep client boundaries small and pushed to the leaves — a `'use client'` boundary pulls everything it *imports* into the client bundle, though server components passed in via `children`/props still render on the server.
- **Svelte / Tauri — favor lightweight, native-feeling UI.** Mind bundle size; prefer Svelte's built-in reactivity and transitions over heavy dependencies. Account for webview platform quirks (font rendering, scroll behavior, drag regions, safe areas) — it's a real browser engine with per-OS differences, not a fixed target.

## 9. Summary Cheat Sheet

- **Did I inline a hex or an `[13px]` arbitrary value?** Stop. It belongs in the token scale — add it there, reference the name.
- **Are margins/padding between sections from the spacing scale?** They must be. No arbitrary section spacing; prefer container `gap-*`.
- **Do any utilities cancel each other out?** Resolve at one layer; don't stack overrides that depend on source order.
- **Are sizes/weights/line-heights from the type scale, with display and body distinguished?** If not, fix the scale, don't inline.
- **One icon set, one size, one stroke weight?** Mixed sets are a defect. `lucide-react` (Next) / `@lucide/svelte` (Svelte).
- **Did I hand-roll a button/input/dialog that the primitives layer already solves?** Compose from `shadcn/ui` (Next) / `shadcn-svelte` (Svelte) instead.
- **Semantic HTML, accessible names, visible focus, reduced-motion, color-not-alone, touch targets?** All present, or it's not done.
- **Does it hold mobile-first down to ~320px on the defined breakpoints?** Test narrow before calling it done.
- **Next: is this component client-side only where it has to be?** Default server; keep `'use client'` boundaries small and at the leaves.
- **Svelte/Tauri: bundle lean, webview quirks accounted for?** Native-feeling and lightweight, not a ported desktop layout.
