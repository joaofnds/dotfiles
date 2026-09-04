# House coding style: frontend

Stack-specific rules for building UI, on top of core.md and typescript.md.
Framework-agnostic by default. The primary stack is Next.js with Tailwind, the
secondary is Tauri with Svelte. When a rule is framework-specific it says so. These
conventions are the floor under all UI work, ratified direction or not.

Contents: tokens; spacing; type; icons; component primitives; accessibility floor;
responsive; framework-specific.

## Tokens are the single source of truth

- Reusable visual values come from the scale. Color, spacing, type, radius, shadow,
  and z-index use Tailwind theme tokens or CSS custom properties.
- Add semantic tokens for reusable roles. A brand color or repeated radius belongs
  in `tailwind.config` or `:root`. Do not add a global token for local geometry
  with no reusable meaning.
- Arbitrary values need a local reason. Computed transforms and one-off grid
  geometry may use `[...]`. Repetition is evidence that the value should become a
  token.
- Semantic tokens over raw ones at the call site. Reference `bg-surface`,
  `text-muted`, `border-default`, never `bg-zinc-900`. The raw scale defines values
  once. Semantic tokens map them to roles, so a theme change is one edit instead of
  a find-and-replace.

## Spacing

- One spacing scale, used consistently. Margins, padding, and gaps come from the
  Tailwind spacing scale. No arbitrary values between sections. Section rhythm is
  the most visible place inconsistency leaks in.
- Prefer layout primitives over per-element margins: `flex` or `grid` with `gap-*`
  over stacking `mt-*` on children. Owning the gap at the container removes the
  margin-collapse and double-spacing bugs.
- Watch for utilities that cancel each other out. A type-level selector and an
  element-level selector fighting over the same padding produces spacing that
  depends on source order. Resolve it at one layer. Do not stack overrides.

## Type

- A defined type scale, not ad-hoc sizes. Sizes, weights, and line-heights come from
  the scale. Each step pairs a size with an intentional line-height: body copy gets
  room, display sits tight. No arbitrary `text-[15px]` or `leading-[1.3]`.
- Display and body are distinct roles. Distinguish them deliberately, by family,
  weight, and tracking, and apply each to its role consistently. Headings are not
  body text at a larger size.
- Weights are chosen, not defaulted. Pick the weights the design uses and stick to
  them. Do not reach for `font-bold` reflexively where the scale calls for
  `font-medium`.

## Icons

- One icon set per project, with consistent size and stroke weight across the whole
  UI. Mixing sets, sizes, or stroke weights reads as unfinished immediately.
- Preserve the project's icon set. For a greenfield Next or Svelte UI with no
  established icon system, prefer `lucide-react` or `@lucide/svelte`. The old
  `lucide-svelte` package is deprecated. `@lucide/svelte` is the Svelte 5
  successor.

## Component primitives

- Compose from a real component layer. Do not hand-roll every element. Buttons,
  inputs, dialogs, menus, and tooltips come from a primitives layer with
  accessibility and keyboard behavior already solved. Re-implementing them per
  feature is where bugs and inconsistency breed.
- Use the project's accessible component layer. For a greenfield Next or Svelte UI
  without one, prefer shadcn/ui or shadcn-svelte. Drop to their headless primitives
  only for behavior the styled layer does not cover.
- Own the copied components, then extend. shadcn/ui and shadcn-svelte copy code into
  the repo, and that copy is ours to edit. The headless layers underneath are
  installed packages and stay as-is. Adjust the copied component to fit the token
  system once. Do not override it ad hoc at each call site.

## Accessibility floor (non-negotiable)

- Semantic HTML first. A `<button>` is a button, a `<nav>` is a nav, and the heading
  hierarchy is real. `<div onClick>` is a defect. It loses focus, keyboard, and
  assistive-tech behavior you would then re-implement worse.
- Every control has an accessible name: a visible `<label>` for form controls, an
  `aria-label` for icon-only buttons. Semantics alone are not enough. A `<button>`
  whose only child is an icon has an empty accessible name and is invisible to
  screen readers.
- Visible keyboard focus. Every interactive element is reachable and operable by
  keyboard with a visible focus indicator. Never `outline: none` without a
  replacement.
- `prefers-reduced-motion` respected. Gate non-essential animation behind it. Motion
  is an enhancement, never a requirement for using the UI.
- Color is never the sole carrier of meaning. Pair it with text, icon, or shape.
  State, validation, and categories must survive color blindness and grayscale.
- Hit targets sized for touch, around 44px, with adequate spacing. Do not ship
  desktop-only click areas.

## Responsive

- Mobile-first. Base styles target small screens. Layer up with min-width
  breakpoints (`sm:`, `md:`, `lg:`). Do not author desktop-first and patch
  downward.
- Use the defined breakpoints. Stick to the theme's breakpoint scale. Do not invent
  one-off widths per component.
- Test narrow widths. A layout is not done until it holds at about 320px. Narrow is
  where overflow, truncation, and spacing collapse surface.

## Framework-specific

- **Next: be deliberate about server versus client components.** Default to server
  components. Reach for `'use client'` only where interactivity or browser APIs
  demand it. Keep client boundaries small and pushed to the leaves. A
  `'use client'` boundary pulls everything it imports into the client bundle;
  server components passed in via `children` or props still render on the server.
- **Svelte and Tauri: favor lightweight, native-feeling UI.** Mind bundle size.
  Prefer Svelte's built-in reactivity and transitions over heavy dependencies.
  Account for webview platform quirks per OS: font rendering, scroll behavior,
  drag regions, safe areas. It is a real browser engine with per-OS differences,
  not a fixed target.
