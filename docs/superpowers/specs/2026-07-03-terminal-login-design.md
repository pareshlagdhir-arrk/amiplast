# Terminal-Style Login Page — Design Spec

Date: 2026-07-03

## Context

Amiplast is an inventory management / sales & purchase invoice generator webapp (Next.js 16 + Tailwind + PostgreSQL + JWT auth). The customer wants the whole webapp to eventually read as a console/CLI-style application rather than a typical SaaS UI. This spec covers the first step: restyling the existing login page (`app/page.tsx`) into a terminal look and feel, and establishing the component/font foundation the rest of the app will build on.

No component library is currently in use. This spec introduces shadcn/ui as the base component system going forward.

## Goals

- Restyle the login page to look like a modern developer terminal window (iTerm2 / VS Code integrated terminal style): dark background, window chrome with traffic-light dots, monospace type, muted terminal accent colors.
- Establish `Space Mono` (Google Font) as the app-wide font, replacing `Inter`.
- Introduce shadcn/ui as the component library foundation for this and future console-styled screens (inventory, invoicing).
- Preserve all existing login behavior exactly — this is a visual-only change.

## Non-goals

- No change to authentication logic, API routes, JWT/session handling, or form field validation.
- No change to the login interaction model — it remains a standard username/password form with a submit button, not a literal command-line/typed-command flow.
- No redesign of the dashboard or other pages in this pass (may follow as separate specs).
- Not using the actual "DepartureMono" font (not available via Google Fonts) — `Space Mono` is the agreed substitute. Nerd Font glyph/icon usage is out of scope for this pass; icons stay as inline SVGs as today.

## Approach

### Font

- In `app/layout.tsx`, replace the `Inter` import from `next/font/google` with `Space_Mono` (weights: 400, 700), keeping the same CSS variable wiring pattern (`--font-space-mono` in place of `--font-inter`).
- Update `tailwind.config.ts`'s `fontFamily.sans` mapping to reference the new variable, so the monospace font becomes the default body font app-wide (not just on the login page), since the customer's ambition is a console-styled app overall.

### Component library

- Initialize shadcn/ui in the project:
  - Add `components.json` pointing at the existing `app/` structure and Tailwind config.
  - Add `lib/utils.ts` exporting the standard `cn()` helper (clsx + tailwind-merge).
  - Install and generate local copies of: `Button`, `Input`, `Label`, `Checkbox` components under `components/ui/`.
- These primitives are restyled (via Tailwind classes / CSS variables in `globals.css`) to match the terminal palette rather than shadcn's default theme — this is the first of what will become a small "console" design system reused by later screens.

### Visual design (login page)

- **Page background:** full-bleed dark background (near-black, e.g. `#0d1117`), replacing the current lavender `#c9c4e2` page background.
- **Terminal window card:** single centered card (replacing the current two-column pastel layout) sized similarly to today's card, with:
  - A title bar strip across the top containing three decorative circular dots (red/yellow/green, non-interactive) left-aligned, and a centered/left title label reading `amiplast — login`, all in the terminal monospace font.
  - A dark card body (`#0d1117` or a very slightly lighter shade for contrast against the page background, e.g. `#111827`) with a thin 1px border in a muted gray, and a subtle box-shadow instead of the current pastel drop shadow.
- **Logo:** the current `BrandMark` SVG (abstract pastel shapes) is replaced with a monospace-rendered wordmark, e.g. stylized `AMIPLAST` text (optionally with a simple ASCII/box-drawing accent), rendered in a terminal accent color (green or cyan) instead of the SVG graphic.
- **Form fields:** replace the current floating-label/underline inputs with terminal-prompt-styled fields built on the new shadcn `Input`/`Label` components:
  - Label text styled as a prompt, e.g. `username:` / `password:` in a muted accent color (terminal green/cyan), monospace, lowercase.
  - Inputs keep a minimal underline/bottom-border style (transparent background, no rounded box) but recolored for dark mode — light monospace text on transparent background, accent-colored bottom border on focus (replacing today's `#28d8c6` focus color, or reusing it as the terminal accent — see Open Question below).
  - A blinking-cursor-style caret effect is a nice-to-have if trivial via CSS; not required.
- **Remember me:** replace the current circular checkbox with a bracket-style checkbox using the new shadcn `Checkbox` component restyled to render as `[x]` (checked) / `[ ]` (unchecked) in monospace, with the "Keep me logged in" label text in the muted terminal color.
- **Error state:** restyle the current red error banner as terminal stderr-style output — left-aligned, monospace, prefixed with `error:` or `!`, red text on transparent/dark background (no pill/rounded background box).
- **Submit button:** replace the current pill-shaped teal button with a shadcn `Button` restyled as a terminal command button — sharp (or minimally rounded) corners, monospace uppercase text such as `[ RUN login ]`, bordered outline style with a subtle glow on hover/focus, loading state changes text to something like `RUNNING...`.
- **Footer:** replace the current `About / Privacy / Terms of use / FAQ` nav row with a bottom command-hint bar styled like terminal keybind hints, e.g. `[ ?  help ]   [ i  about ]   [ t  terms ]`, small and muted, monospace. Same informational links, just restyled; no new navigation behavior.
- **Bottom caption:** "Existing users only" stays, restyled as a muted monospace comment-style line (e.g. prefixed with `#` or `//`) beneath the button.

### Accent color palette (proposed)

- Background (page): `#0d1117`
- Card background: `#111827`
- Border: `#30363d`
- Primary text: `#c9d1d9`
- Muted/label text: `#6e7681`
- Accent (prompts, focus, links, logo): `#28d8c6` (reusing the existing brand teal so the terminal theme still feels like "Amiplast" and not a generic terminal)
- Error: `#f85149`

This keeps one thread of brand continuity (the teal accent) while moving everything else to a terminal-appropriate dark palette.

## Data flow / behavior

No changes. `handleSubmit` continues to `POST /api/auth/login` with `{ username, password, remember }` and routes to `/dashboard` on success, exactly as today.

## Testing

- Manual verification in the browser (dev server) covering:
  - Successful login redirects to `/dashboard`.
  - Invalid credentials show the restyled terminal-style error message.
  - Password show/hide toggle still works.
  - Remember-me checkbox toggles the bracket state.
  - Responsive check at mobile width (card should stack/scale reasonably; current layout is already single-column-friendly since we're moving off the two-column split).
- No new automated tests are introduced for a pure visual restyle; existing behavior is unchanged so no existing tests (none currently exist for this page) are affected.

## Open questions

None blocking — the accent color and font choices above are proposed defaults; if the user wants a different accent color than the current teal (e.g. classic green-phosphor `#39ff14` or amber `#ffb000`), that's a one-line change to the palette section during implementation.
