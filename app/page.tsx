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

          <label className="mt-5 flex cursor-pointer items-center gap-1.5 text-xs text-[#737aa2]">
            <span className="font-bold text-[#7aa2f7]">[</span>
            <Checkbox checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} />
            <span className="font-bold text-[#7aa2f7]">]</span>
            keep me logged in
          </label>

          {error ? <p className="mt-5 text-xs text-[#f7768e]">error: {error}</p> : null}

          <Button className="mt-7 w-full" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </Button>

          <p className="mt-6 text-xs text-[#565f89]"># existing users only</p>
        </form>

        <div className="flex items-center justify-between border-t border-[#2f3549] px-8 py-3 text-xs text-[#737aa2]">
          <span>~/amiplast &gt; login</span>
          <span className="text-[#565f89]">enter to submit</span>
        </div>
      </section>
    </main>
  );
}
