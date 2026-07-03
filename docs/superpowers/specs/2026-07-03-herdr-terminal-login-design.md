# Herdr-Inspired Terminal Login — Design Spec

Date: 2026-07-03

## Context

The previous spec (`2026-07-03-terminal-login-design.md`) restyled the login page into a generic dark-terminal look with a teal accent and Space Mono. The customer has since pointed to [herdr.dev](https://herdr.dev/) as the design reference to adopt going forward — a "terminal multiplexer" product site with a specific, well-executed CLI aesthetic. This spec supersedes the previous visual language (palette, font, chrome details) for the login page, while keeping the same shadcn/ui component foundation (`Button`, `Input`, `Label`, `Checkbox`) and interaction model already in place.

Herdr's default color theme (confirmed by downloading and inspecting its stylesheet, `https://herdr.dev/css/style.css`) is its built-in "Tokyo Night" palette. That palette, and herdr's actual button/typography treatment, are adopted verbatim below rather than approximated from the screenshot.

The user confirmed layout style can vary page-to-page in this app going forward (e.g. a future dashboard could use herdr's split sidebar/multi-pane layout) — this spec covers only the login page, using a single centered card.

## Goals

- Replace the login page's current palette (teal accent, `#0d1117`/`#111827` near-black background) with herdr's exact Tokyo Night palette.
- Replace the app-wide font, Space Mono, with **JetBrains Mono** (the font herdr actually uses), via `next/font/google`.
- Replace the login card's chrome: drop the macOS-style traffic-light title bar from the previous design (not a pattern herdr uses) in favor of herdr's actual terminal-pane header convention (bold title + muted breadcrumb subtitle line).
- Replace the submit button's bracket-styled outline look with herdr's actual `.button-primary` component: solid light fill, dark text, accent fill on hover.
- Replace the footer link row with a herdr-style breadcrumb/status strip.
- Reuse the existing `components/ui/{button,input,label,checkbox}.tsx` primitives and `handleSubmit`/state logic in `app/page.tsx` — recolor and restyle them, do not rewrite their behavior.

## Non-goals

- No change to authentication logic, API routes, or the login interaction model (still a standard username/password form, not a command-driven flow) — same constraint as the previous spec.
- No multi-pane / sidebar / tab-bar layout on the login page — that structure belongs to herdr's marketing homepage, not a sign-in form. (May be revisited for other pages, e.g. dashboard, in a future spec.)
- No theme switcher (herdr supports many palettes; this app hard-codes Tokyo Night as its one theme).
- Not literally copying herdr's HTML/CSS files — values are read from them for accuracy, but the implementation is our own Tailwind-based components.

## Approach

### Font

- Replace `Space_Mono` in `app/layout.tsx` with `JetBrains_Mono` from `next/font/google` (weights `400` and `700`), variable renamed to `--font-jetbrains-mono`.
- Update `tailwind.config.ts`'s `fontFamily.mono` to reference the new variable (keep `font-mono` as the utility name and its app-wide application on `<body>`, unchanged from before).

### Color palette (exact values from herdr's Tokyo Night theme)

| Token | Hex | Usage |
|---|---|---|
| Page background | `#1a1b26` | `<main>` background |
| Card/panel background | `#202331` | Login card body |
| Border | `#2f3549` | Card border, input underlines |
| Border (strong/focus) | `#414868` | Reserved for stronger dividers if needed |
| Primary text | `#d5dcff` | Headings, primary button text-on-light |
| Secondary/terminal text | `#c0caf5` | Body/input text |
| Muted text | `#737aa2` | Breadcrumbs, captions, footer hints |
| Dim muted | `#565f89` | Placeholder text |
| Accent (indigo/periwinkle) | `#7aa2f7` | Focus borders, prompt labels, links, hover states |
| Success/green | `#9ece6a` | Reserved for future status use (not used on login) |
| Warning/amber | `#e0af68` | Reserved for future status use (not used on login) |
| Error/red | `#f7768e` | Error message text |

These replace every teal (`#28d8c6`) and near-black (`#0d1117`/`#111827`/`#30363d`/`#c9d1d9`/`#6e7681`/`#f85149`) value from the previous spec's palette, in the login page and in the shared `components/ui/*` primitives.

Radii: `4px` for the card and buttons (herdr's `--radius-md`), `2px` for small controls like the checkbox (herdr's `--radius-sm`).

### Card chrome

Drop the traffic-light-dot title bar entirely. Replace it with herdr's own terminal-pane header pattern — a bold title line followed by a muted breadcrumb-style subtitle, directly modeled on herdr's `* Claude Code v2.1.168` / `~/Projects/herdr · master` pane header:

```
* Amiplast
~/amiplast · login
```

The card is a single bordered panel (`1px solid #2f3549`, background `#202331`, `4px` radius) centered on the `#1a1b26` page background, with a soft dark drop shadow matching herdr's own terminal-mockup shadow (`0 24px 80px rgba(0,0,0,0.4)`).

### Form fields

Same structural pattern as the previous spec (bottom-border-only inputs, labels above as prompts), recolored:
- `username:` / `password:` labels in the accent color `#7aa2f7` (matches herdr's `--term-prompt`, which is the same value as its `--accent`).
- Input text in `#c0caf5`, placeholder in `#565f89`.
- Input wrapper bottom border `#2f3549`, turning `#7aa2f7` on focus (`focus-within`).
- Password show/hide icon button unchanged in behavior; icon color muted `#737aa2`, hover accent `#7aa2f7`.

### Checkbox ("Keep me logged in")

Unchanged bracket convention (`[` `Checkbox` `]`) since herdr has no direct equivalent UI to borrow — bracket characters and the checked `x` glyph in accent `#7aa2f7`, label text muted `#737aa2`.

### Error state

Unchanged structural convention (`error: <message>`, left-aligned, no pill background) — text color changes from the old red (`#f85149`) to herdr's red (`#f7768e`).

### Submit button

Replace the previous bracket-styled outline button (`[ run login ]`) with herdr's actual `.button-primary` component, translated to Tailwind:
- Default: solid background `#d5dcff` (herdr's `--ink`), text `#1a1b26` (herdr's `--bg`) — a light pill on the dark page, exactly as herdr's `Quick start` button renders.
- Hover: background becomes accent `#7aa2f7`, text becomes white — matching herdr's `.button-primary:hover` rule exactly.
- Label: plain text, no brackets — `Log in` normally, `Logging in...` while loading (drop the `running...`/`[ run login ]` phrasing from the previous spec, since herdr's own buttons use plain labels, not bracket/command syntax).
- Radius `4px`, font-weight `600`, matching herdr's `.button` base rule.

### Footer

Replace the previous `[ ? help ] [ i about ] [ t terms ]` row with a herdr-style breadcrumb/status strip, modeled on herdr's `~/Projects/herdr > master > ctx —— 3% 34k/1M` status bar:
- Left-aligned: `~/amiplast > login`, muted `#737aa2`.
- Right-aligned: a small usage hint, `enter to submit`, dim `#565f89`.

The "Existing users only" caption beneath the button is unchanged in placement/style (muted, `#`-prefixed comment line), recolored to `#565f89`.

## Data flow / behavior

No changes. `handleSubmit` continues to `POST /api/auth/login` with `{ username, password, remember }` and routes to `/dashboard` on success, exactly as today. `components/ui/{button,input,label,checkbox}.tsx` keep their existing prop interfaces (`className`, `checked`/`onCheckedChange`, etc.) — only their internal Tailwind color classes change.

## Testing

Same approach as the previous spec: no automated test framework in this repo. Verification is `npm run typecheck` / `npm run lint`, plus manual browser confirmation of:
- Card renders with the new dark-indigo palette and JetBrains Mono font.
- Focus states on username/password turn the accent indigo (`#7aa2f7`), not the old teal.
- Submit button matches herdr's light-pill-with-accent-hover behavior.
- Error message renders in the new red (`#f7768e`).
- Checkbox bracket toggle still works.
- Responsive check at mobile width.

## Open questions

None blocking. If a future page (e.g. dashboard) adopts herdr's multi-pane/sidebar layout, that will be a separate spec — this one is scoped to the login page's visual language only.
