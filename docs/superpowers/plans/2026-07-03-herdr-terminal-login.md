# Herdr-Inspired Terminal Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the already-terminal-styled login page from its current teal/Space-Mono look to herdr.dev's exact Tokyo Night palette and JetBrains Mono typography, replacing the macOS-traffic-light card header and bracket-styled button with herdr's own pane-header and primary-button conventions.

**Architecture:** This is a palette/typography swap on top of the existing structure from the prior plan (`2026-07-03-terminal-login.md`): the same `components/ui/{button,input,label,checkbox}.tsx` primitives and the same `app/page.tsx` state/`handleSubmit` logic stay in place. Only Tailwind color classes, the app font, and a few structural JSX blocks (card header, footer, button label) change.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3, TypeScript, existing `@radix-ui/*` + `class-variance-authority` + `clsx` + `tailwind-merge` primitives (all already installed — no new dependencies).

## Global Constraints

- Font: **JetBrains Mono** from `next/font/google`, weights `400` and `700`, exposed as CSS variable `--font-jetbrains-mono`, applied app-wide via Tailwind's `font-mono` utility on `<body>` (replacing `Space_Mono` / `--font-space-mono`).
- Color palette (use these exact hex values everywhere in this feature — herdr.dev's default Tokyo Night theme, confirmed from its stylesheet):
  - Page background: `#1a1b26`
  - Card/panel background: `#202331`
  - Border: `#2f3549`
  - Primary text (headings, button text-on-light): `#d5dcff`
  - Secondary/terminal text (body, inputs): `#c0caf5`
  - Muted text (breadcrumbs, captions): `#737aa2`
  - Dim muted (placeholders, secondary hints): `#565f89`
  - Accent (indigo/periwinkle — prompts, focus, links, hover): `#7aa2f7`
  - Error/red: `#f7768e`
- Radii: `4px` (Tailwind's default `rounded`) for the card and buttons.
- Card shadow: `0 24px 80px rgba(0,0,0,0.4)` (herdr's own terminal-mockup shadow).
- Do not change any authentication logic, API routes, or the `handleSubmit` request/response handling in `app/page.tsx`.
- Do not change the login interaction model — standard username/password form, not a typed-command flow.
- Drop the macOS-style traffic-light title bar entirely; replace with herdr's pane-header convention (bold title + muted breadcrumb subtitle).
- Submit button uses herdr's actual `.button-primary` treatment (solid light fill `#d5dcff` / dark text `#1a1b26`, hover solid accent `#7aa2f7` / white text) with a plain text label — no bracket/command-syntax labels (`[ run login ]` is replaced with `Log in`).
- No automated test framework exists in this repo (no `test` script in `package.json`). Verification for each task is `npm run typecheck` and `npm run lint`, plus manual/curl-based checks — do not introduce a new test framework.
- Git is initialized and all prior work is on `main`; continue committing directly to `main` (per the earlier plan's git setup and the user's choice to work on `main`).

---

## File Structure

- Modify `app/layout.tsx` — swap `Space_Mono` for `JetBrains_Mono`.
- Modify `tailwind.config.ts` — point `fontFamily.mono` at the new `--font-jetbrains-mono` variable.
- Modify `app/globals.css` — swap the fallback `html`/`body` background/text colors to the new palette.
- Modify `components/ui/button.tsx` — replace the teal bracket-outline variant with herdr's solid primary-button treatment.
- Modify `components/ui/input.tsx` — recolor text/placeholder to the new palette.
- Modify `components/ui/label.tsx` — recolor prompt-label text to the new accent.
- Modify `components/ui/checkbox.tsx` — recolor the bracket-checkbox glyph to the new accent.
- Modify `app/page.tsx` — recolor the page/card, replace the traffic-light header with a pane-header block, replace the footer link row with a breadcrumb/hint strip, and change the submit button's label from `[ run login ]` / `running...` to `Log in` / `Logging in...`.

---

### Task 1: Switch font to JetBrains Mono and update global fallback colors

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: the `font-mono` Tailwind utility now renders JetBrains Mono app-wide (same utility name as before — Tasks 2 and 3 need no changes to pick this up).

- [ ] **Step 1: Replace the font in `app/layout.tsx`**

Replace the full contents of `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-jetbrains-mono' });

export const metadata: Metadata = {
  title: 'Amiplast Auth',
  description: 'Next.js PostgreSQL JWT authentication app'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${jetbrainsMono.variable} font-mono`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Point Tailwind's `mono` family at the new variable**

In `tailwind.config.ts`, replace the `fontFamily` block:

```typescript
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
```

- [ ] **Step 3: Update `app/globals.css` fallback colors**

Replace lines 13–22 of `app/globals.css`:

```css
html,
body {
  min-height: 100%;
  margin: 0;
  background: #1a1b26;
}

body {
  color: #c0caf5;
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors.

Run: `npm run dev` (in background, on a free port — check with `lsof -i :<port> -sTCP:LISTEN` first since other dev servers may already be running in this environment), then `curl -s http://localhost:<port> | grep -o 'font-mono'`
Expected: output contains `font-mono`, confirming the class is present in the rendered HTML. Stop the dev server afterward with the PID you started (never kill a process you didn't start yourself).

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx tailwind.config.ts app/globals.css
git commit -m "Switch app font to JetBrains Mono and update palette fallback"
```

---

### Task 2: Recolor shared UI primitives to the Tokyo Night palette

**Files:**
- Modify: `components/ui/button.tsx`
- Modify: `components/ui/input.tsx`
- Modify: `components/ui/label.tsx`
- Modify: `components/ui/checkbox.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (unchanged).
- Produces (consumed by Task 3, unchanged prop signatures from the prior plan):
  - `Button` — same props as before (`asChild?: boolean` + native button attributes); only its internal Tailwind classes change.
  - `Input` — same props as before; only internal classes change.
  - `Label` — same props as before; only internal classes change.
  - `Checkbox` — same props as before; only internal classes change.

- [ ] **Step 1: Replace `components/ui/button.tsx`**

Replace the full contents:

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded bg-[#d5dcff] px-4 py-2.5 text-sm font-semibold text-[#1a1b26] transition-colors hover:bg-[#7aa2f7] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-[#d5dcff] disabled:hover:text-[#1a1b26]',
  {
    variants: {},
    defaultVariants: {}
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ className }))} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

- [ ] **Step 2: Replace `components/ui/input.tsx`**

Replace the full contents:

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full bg-transparent text-sm text-[#c0caf5] outline-none placeholder:text-[#565f89] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
```

- [ ] **Step 3: Replace `components/ui/label.tsx`**

Replace the full contents:

```tsx
'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn('text-[11px] font-medium lowercase tracking-wide text-[#7aa2f7]', className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 4: Replace `components/ui/checkbox.tsx`**

Replace the full contents:

```tsx
'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '@/lib/utils';

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'flex h-4 w-4 items-center justify-center bg-transparent text-[11px] font-bold leading-none text-[#7aa2f7] outline-none',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>x</CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors. These four files are not yet consumed with the new page styling until Task 3, but they must compile and lint cleanly on their own.

- [ ] **Step 6: Commit**

```bash
git add components/ui/button.tsx components/ui/input.tsx components/ui/label.tsx components/ui/checkbox.tsx
git commit -m "Recolor shared UI primitives to herdr's Tokyo Night palette"
```

---

### Task 3: Restyle the login page card, header, and footer

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Button`, `Input`, `Label`, `Checkbox` from Task 2 (same prop signatures as before — `Checkbox`'s `onCheckedChange: (checked: CheckboxPrimitive.CheckedState) => void`, `Input`/`Label`/`Button` accept `className` plus their native/Radix props).

- [ ] **Step 1: Replace the full contents of `app/page.tsx`**

```tsx
'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

function EyeSlashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58A2 2 0 0 0 13.42 13.4M9.88 5.12A10.8 10.8 0 0 1 12 4.9c5.05 0 8.22 4.17 9.24 5.78.22.35.22.8 0 1.15a18.4 18.4 0 0 1-2.32 2.82M6.2 6.25a18.1 18.1 0 0 0-3.44 4.43c-.22.35-.22.8 0 1.15C3.78 13.44 6.95 17.6 12 17.6c1.36 0 2.59-.3 3.68-.79" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12S5.42 5.25 12 5.25 21.75 12 21.75 12 18.58 18.75 12 18.75 2.25 12 2.25 12Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, remember })
    });

    setLoading(false);

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { message?: string } | null;
      setError(data?.message ?? 'Unable to login');
      return;
    }

    router.push('/dashboard');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a1b26] px-5 py-10 text-[#c0caf5]">
      <section className="w-full max-w-[420px] overflow-hidden rounded border border-[#2f3549] bg-[#202331] shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <div className="border-b border-[#2f3549] px-8 py-5">
          <p className="text-sm font-bold text-[#d5dcff]">* Amiplast</p>
          <p className="mt-0.5 text-xs text-[#737aa2]">~/amiplast · login</p>
        </div>

        <form className="px-8 py-8" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <Label htmlFor="username">username:</Label>
            <div className="border-b border-[#2f3549] transition-colors focus-within:border-[#7aa2f7]">
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="mt-6 space-y-1.5">
            <Label htmlFor="password">password:</Label>
            <div className="flex items-center gap-2 border-b border-[#2f3549] transition-colors focus-within:border-[#7aa2f7]">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="text-[#737aa2] transition hover:text-[#7aa2f7]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-1.5 text-[11px] text-[#737aa2]">
            <span className="font-bold text-[#7aa2f7]">[</span>
            <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
            <span className="font-bold text-[#7aa2f7]">]</span>
            keep me logged in
          </label>

          {error ? <p className="mt-5 text-[11px] text-[#f7768e]">error: {error}</p> : null}

          <Button className="mt-7 w-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>

          <p className="mt-6 text-[11px] text-[#565f89]"># existing users only</p>
        </form>

        <div className="flex items-center justify-between border-t border-[#2f3549] px-8 py-3 text-[10px] text-[#737aa2]">
          <span>~/amiplast &gt; login</span>
          <span className="text-[#565f89]">enter to submit</span>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "Restyle login page to herdr's Tokyo Night pane-header layout"
```

---

### Task 4: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Check for a free port first (`lsof -i :<port> -sTCP:LISTEN`), then run: `npm run dev -- -p <free-port>` (in background).
Expected: server starts with no build errors in the terminal output. If `next dev`'s file-lock rejects a second instance because another dev server from earlier work is still running in this environment, reuse that already-running server instead of trying to force a new one — do not kill a process you did not start yourself.

- [ ] **Step 2: Visually verify in a browser**

Open the running dev server's URL in a browser and confirm, against `docs/superpowers/specs/2026-07-03-herdr-terminal-login-design.md`'s Testing section:
- Page renders on a `#1a1b26` background with a `#202331` card bordered in `#2f3549`, using JetBrains Mono throughout (no more teal, no more macOS traffic-light dots).
- Card header shows `* Amiplast` / `~/amiplast · login` in place of the old dot-title-bar.
- Typing in the username/password prompts works; labels render in indigo `#7aa2f7`; focusing an input turns its underline `#7aa2f7`. The password show/hide eye icon still toggles the field type.
- Clicking the `[ ]` remember-me checkbox toggles between empty and `x`, in `#7aa2f7`.
- Submitting with invalid credentials shows `error: ...` in `#f7768e`.
- The submit button renders as a solid light (`#d5dcff`) pill with dark text reading `Log in`, and turns solid accent (`#7aa2f7`) with white text on hover.
- The footer strip reads `~/amiplast > login` on the left and `enter to submit` on the right, replacing the old `[ ? help ]` links.
- Submitting with valid credentials (see `scripts/create-user.ts` / existing seeded user) redirects to `/dashboard`.
- Resize the browser to a narrow (mobile) width and confirm the card stays readable and doesn't overflow horizontally.

If no browser-automation tool (e.g. chromium-cli, playwright) is available in this environment, perform the structural checks that are possible without one — `curl` the page and `grep` for the new copy/markup (`* Amiplast`, `~/amiplast`, `Log in`, `enter to submit`) — and say explicitly in your report which checks could not be completed interactively, rather than claiming full visual verification.

- [ ] **Step 3: Stop the dev server**

Stop only the background `npm run dev` process you personally started in Step 1 (by its PID), if you started one. Leave any pre-existing dev server running.

---

## Self-Review Notes

- **Spec coverage:** JetBrains Mono font swap (Task 1), full Tokyo Night palette across globals + primitives + page (Tasks 1–3), dropped traffic-light header replaced with pane-header block (Task 3), herdr-style primary button with plain `Log in` label (Task 2 + Task 3), breadcrumb/hint footer (Task 3), unchanged auth logic (verified by copying `handleSubmit`/state verbatim in Task 3) — all covered. The spec's explicit non-goals (no theme switcher, no multi-pane layout) require no task since they are exclusions, not deliverables.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code or an exact command with expected output.
- **Type consistency:** `Button`/`Input`/`Label`/`Checkbox` prop signatures are unchanged from the prior plan (Task 2 only edits internal Tailwind classes, not types), so Task 3's usage (`className`, `id`, `htmlFor`, `checked`, `onCheckedChange`, `disabled`, `type`) matches exactly what Task 2 exports.
