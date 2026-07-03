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
