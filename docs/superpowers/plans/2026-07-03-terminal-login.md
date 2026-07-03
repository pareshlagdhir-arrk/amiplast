# Terminal-Style Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing login page into a modern dark developer-terminal look, on top of a new shadcn/ui-based component foundation, without changing any authentication behavior.

**Architecture:** Introduce a small set of hand-written shadcn-style primitives (`Button`, `Input`, `Label`, `Checkbox`) under `components/ui/`, backed by a `cn()` class-merging helper in `lib/utils.ts`. Switch the app-wide font from Inter to Space Mono. Rewrite `app/page.tsx`'s JSX/styling to a terminal-window layout using the new primitives, keeping all existing state and `fetch` logic untouched.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 3, TypeScript, `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-label`, `@radix-ui/react-checkbox`, `clsx`, `tailwind-merge`.

## Global Constraints

- Font: `Space Mono` from `next/font/google`, weights `400` and `700`, exposed as CSS variable `--font-space-mono`, applied app-wide via Tailwind's `font-mono` utility on `<body>`.
- Color palette (use these exact hex values everywhere in this feature): page/card-shell background `#0d1117`, card body background `#111827`, border `#30363d`, primary text `#c9d1d9`, muted/label text `#6e7681`, accent (prompts, focus, links, logo) `#28d8c6`, error `#f85149`.
- Do not change any authentication logic, API routes (`app/api/auth/**`), or the `handleSubmit` request/response handling in the login page.
- Do not change the login interaction model — it stays a standard username/password form with a submit button, not a typed-command flow.
- Git was initialized for this project with a baseline commit (`Initial commit of existing Amiplast auth app`) immediately before this plan's execution began. Each task should end with a commit of its changes.
- No automated test framework exists in this repo (no `test` script in `package.json`). Verification for each task is `npm run typecheck` (and `npm run lint` where noted), plus a final manual browser check — do not introduce a new test framework as part of this plan.

---

## File Structure

- Create `lib/utils.ts` — exports `cn()`, the class-merging helper every UI primitive uses.
- Create `components.json` — shadcn CLI config, so future components can be added with `npx shadcn add <name>` consistently with the primitives built here.
- Create `components/ui/button.tsx` — terminal-style button primitive (single visual variant, matches spec's "terminal command button").
- Create `components/ui/input.tsx` — bare-bones text input primitive (no border baked in; callers supply their own wrapper border, matching the existing app pattern of bordered wrapper + borderless input for the password field).
- Create `components/ui/label.tsx` — Radix `Label` wrapper styled as a lowercase terminal-prompt label.
- Create `components/ui/checkbox.tsx` — Radix `Checkbox` wrapper rendering a bare `x` glyph on check (bracket characters are supplied by the caller, per spec's `[x]` / `[ ]` look).
- Modify `app/layout.tsx` — swap `Inter` for `Space_Mono`, apply `font-mono` on `<body>`.
- Modify `tailwind.config.ts` — point `fontFamily.mono` at `var(--font-space-mono)`.
- Modify `app/globals.css` — swap the fallback `html`/`body` background and text color to the new dark palette.
- Modify `app/page.tsx` — full JSX/styling rewrite to the terminal-window layout, using the new primitives; `handleSubmit` and all `useState` calls are copied over unchanged.

---

### Task 1: Project setup — dependencies, `cn()` helper, shadcn config

**Files:**
- Modify: `package.json` (via `npm install`)
- Create: `lib/utils.ts`
- Create: `components.json`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `lib/utils.ts`, imported by every file in Task 2 as `import { cn } from '@/lib/utils';`.

- [ ] **Step 1: Install dependencies**

Run:
```bash
npm install clsx tailwind-merge class-variance-authority @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-checkbox
```
Expected: install completes with no errors; `package.json` `dependencies` now includes `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-slot`, `@radix-ui/react-label`, `@radix-ui/react-checkbox`.

- [ ] **Step 2: Create `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Create `components.json`**

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": false,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui"
  }
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: `tsc --noEmit` exits with no errors (no files import `cn` yet, so this just confirms `lib/utils.ts` itself compiles).

---

### Task 2: shadcn UI primitives — Button, Input, Label, Checkbox

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/label.tsx`
- Create: `components/ui/checkbox.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (Task 1).
- Produces (consumed by Task 4):
  - `Button` — `React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }>`, from `@/components/ui/button`.
  - `Input` — `React.ForwardRefExoticComponent<React.InputHTMLAttributes<HTMLInputElement>>`, from `@/components/ui/input`.
  - `Label` — Radix `Label.Root` wrapper, same props as `@radix-ui/react-label`'s `Root`, from `@/components/ui/label`.
  - `Checkbox` — Radix `Checkbox.Root` wrapper, same props as `@radix-ui/react-checkbox`'s `Root` (notably `checked: boolean`, `onCheckedChange: (checked: CheckboxPrimitive.CheckedState) => void`), from `@/components/ui/checkbox`.

- [ ] **Step 1: Create `components/ui/button.tsx`**

```tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center border border-[#28d8c6] px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#28d8c6] transition-colors hover:bg-[#28d8c6]/10 hover:shadow-[0_0_16px_rgba(40,216,198,0.45)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent disabled:hover:shadow-none',
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

- [ ] **Step 2: Create `components/ui/input.tsx`**

```tsx
import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full bg-transparent text-sm text-[#c9d1d9] outline-none placeholder:text-[#6e7681] disabled:cursor-not-allowed disabled:opacity-50',
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

- [ ] **Step 3: Create `components/ui/label.tsx`**

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
    className={cn('text-[11px] font-medium lowercase tracking-wide text-[#28d8c6]', className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

- [ ] **Step 4: Create `components/ui/checkbox.tsx`**

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
      'flex h-4 w-4 items-center justify-center bg-transparent text-[11px] font-bold leading-none text-[#28d8c6] outline-none',
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
Expected: both commands exit with no errors. These four files are not imported anywhere yet, so this only confirms each compiles and lints cleanly on its own.

---

### Task 3: Switch app font to Space Mono and update dark defaults

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Produces: the `font-mono` Tailwind utility now renders `Space Mono` app-wide (relied on implicitly by Task 4 — no explicit font class needed on the login page itself).

- [ ] **Step 1: Replace the font in `app/layout.tsx`**

Replace the full contents of `app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Space_Mono } from 'next/font/google';
import './globals.css';

const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-space-mono' });

export const metadata: Metadata = {
  title: 'Amiplast Auth',
  description: 'Next.js PostgreSQL JWT authentication app'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${spaceMono.variable} font-mono`}>{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Point Tailwind's `mono` family at the new variable**

In `tailwind.config.ts`, replace the `fontFamily` block:

```typescript
      fontFamily: {
        mono: ['var(--font-space-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
```

(This replaces the existing `sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui']` entry — the app no longer uses the `sans` key.)

- [ ] **Step 3: Update `app/globals.css` fallback colors**

Replace lines 13–22 of `app/globals.css`:

```css
html,
body {
  min-height: 100%;
  margin: 0;
  background: #0d1117;
}

body {
  color: #c9d1d9;
}
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors.

Run: `npm run dev` (in background), then `curl -s http://localhost:3000 | grep -o 'font-mono'`
Expected: output contains `font-mono`, confirming the class is present in the rendered HTML. Stop the dev server afterward.

---

### Task 4: Restyle the login page

**Files:**
- Modify: `app/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `Button` (`@/components/ui/button`), `Input` (`@/components/ui/input`), `Label` (`@/components/ui/label`), `Checkbox` (`@/components/ui/checkbox`) from Task 2; `font-mono` app-wide styling from Task 3.

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
    <main className="flex min-h-screen items-center justify-center bg-[#0d1117] px-5 py-10 text-[#c9d1d9]">
      <section className="w-full max-w-[420px] border border-[#30363d] bg-[#111827] shadow-[0_30px_60px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2 border-b border-[#30363d] bg-[#0d1117] px-4 py-2.5">
          <span className="h-3 w-3 rounded-full bg-[#f85149]" />
          <span className="h-3 w-3 rounded-full bg-[#e3b341]" />
          <span className="h-3 w-3 rounded-full bg-[#3fb950]" />
          <span className="ml-2 text-xs text-[#6e7681]">amiplast — login</span>
        </div>

        <form className="px-8 py-10" onSubmit={handleSubmit}>
          <p className="mb-8 text-lg font-bold tracking-wide text-[#28d8c6]">AMIPLAST</p>

          <div className="space-y-1.5">
            <Label htmlFor="username">username:</Label>
            <div className="border-b border-[#30363d] transition-colors focus-within:border-[#28d8c6]">
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
            <div className="flex items-center gap-2 border-b border-[#30363d] transition-colors focus-within:border-[#28d8c6]">
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
                className="text-[#6e7681] transition hover:text-[#28d8c6]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
              </button>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-1.5 text-[11px] text-[#6e7681]">
            <span className="font-bold text-[#28d8c6]">[</span>
            <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
            <span className="font-bold text-[#28d8c6]">]</span>
            keep me logged in
          </label>

          {error ? <p className="mt-5 text-[11px] text-[#f85149]">error: {error}</p> : null}

          <Button className="mt-7 w-full" type="submit" disabled={loading}>
            {loading ? 'running...' : '[ run login ]'}
          </Button>

          <p className="mt-6 text-[11px] text-[#6e7681]"># existing users only</p>
        </form>

        <div className="flex items-center gap-4 border-t border-[#30363d] px-8 py-3 text-[10px] text-[#6e7681]">
          <span>[ ? help ]</span>
          <span>[ i about ]</span>
          <span>[ t terms ]</span>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: both exit with no errors.

---

### Task 5: Manual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (in background)
Expected: server starts on `http://localhost:3000` with no build errors in the terminal output.

- [ ] **Step 2: Visually verify in a browser**

Open `http://localhost:3000` in a browser and confirm, against `docs/superpowers/specs/2026-07-03-terminal-login-design.md`'s Testing section:
- Page renders a dark terminal window (title bar with 3 dots, `amiplast — login` label, dark card on darker page background) instead of the old pastel two-column layout.
- Typing in the username/password prompts works; the password show/hide eye icon toggles the field type.
- Clicking the `[ ]` remember-me checkbox toggles between empty and `x`.
- Submitting with invalid credentials shows the restyled `error: ...` line in red monospace text (no rounded pink banner).
- Submitting with valid credentials (see `scripts/create-user.ts` / existing seeded user) redirects to `/dashboard`.
- Resize the browser to a narrow (mobile) width and confirm the card stays readable and doesn't overflow horizontally.

- [ ] **Step 3: Stop the dev server**

Stop the background `npm run dev` process once verification is complete.

---

## Self-Review Notes

- **Spec coverage:** font swap (Task 3), shadcn/ui foundation (Tasks 1–2), dark terminal page/card/title-bar (Task 4), prompt-style labels/inputs (Task 4), bracket checkbox (Task 2 + Task 4), terminal error styling (Task 4), terminal submit button (Task 2 + Task 4), footer command-hint bar (Task 4), unchanged auth logic (verified by copying `handleSubmit`/state verbatim in Task 4) — all covered.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code or an exact command with expected output.
- **Type consistency:** `Checkbox`'s `onCheckedChange` signature (`CheckboxPrimitive.CheckedState`) matches its usage in Task 4 (`checked === true` guard); `Button`/`Input`/`Label` prop types match their usage (`className`, `id`, `htmlFor`, `disabled`, `type`) consistently across Tasks 2 and 4.
