'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

function BrandMark() {
  return (
    <svg aria-hidden="true" className="h-16 w-16" viewBox="0 0 96 96" fill="none">
      <rect x="15" y="45" width="48" height="12" rx="6" transform="rotate(-45 15 45)" fill="#0B0B45" />
      <rect x="28" y="58" width="48" height="12" rx="6" transform="rotate(-45 28 58)" fill="#0B0B45" />
      <rect x="41" y="71" width="34" height="12" rx="6" transform="rotate(-45 41 71)" fill="#0B0B45" />
      <circle cx="71" cy="35" r="7" fill="#28D8C6" />
    </svg>
  );
}

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

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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
    <main className="flex min-h-screen items-center justify-center bg-[#c9c4e2] px-5 py-10 text-[#0B0B45]">
      <section className="grid w-full max-w-[1016px] overflow-hidden bg-white shadow-[0_30px_60px_rgba(63,58,110,0.28)] md:min-h-[636px] md:grid-cols-2">
        <div className="relative flex min-h-[540px] flex-col overflow-hidden bg-[#f1f1f9] px-14 py-12 md:min-h-full">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-[39%] h-52 w-52 rounded-full bg-[linear-gradient(150deg,#20d0cf,#006370)]" />
            <div className="absolute left-[34%] -top-14 h-40 w-40 rounded-full bg-[#ff9ca8]" />
            <div className="absolute -right-2 -top-4 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_32%_24%,#1725a7,#05053f_72%)]" />
            <div className="absolute -bottom-16 right-6 h-36 w-36 rounded-full bg-[#ff9ca8]" />
            <div className="absolute bottom-8 right-[92px] h-9 w-9 rounded-full bg-[linear-gradient(150deg,#20d0cf,#006370)]" />
            <div className="absolute bottom-24 right-3 h-6 w-6 rounded-full bg-[radial-gradient(circle_at_32%_24%,#1725a7,#05053f_72%)]" />
          </div>

          <div className="relative z-10 m-auto flex flex-col items-center text-center">
            <BrandMark />
            <h1 className="mt-4 text-4xl font-black tracking-tight">Amiplast</h1>
          </div>

          <nav className="relative z-10 flex gap-6 text-[11px] font-extrabold tracking-wide text-[#0B0B45]">
            <span>About</span>
            <span>Privacy</span>
            <span>Terms of use</span>
            <span>FAQ</span>
          </nav>
        </div>

        <div className="flex items-center justify-center px-10 py-14 sm:px-14">
          <form className="w-full max-w-[215px]" onSubmit={handleSubmit}>
            <h2 className="mb-9 text-[28px] font-black tracking-tight text-[#11133f]">Log in</h2>

            <label className="block text-[11px] font-medium text-slate-400">
              Username
              <input
                className="mt-2 h-9 w-full border-b border-[#c3c4d4] bg-transparent text-sm font-semibold text-[#0B0B45] outline-none transition focus:border-[#28d8c6]"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
              />
            </label>

            <label className="mt-6 block text-[11px] font-medium text-slate-400">
              Password
              <span className="mt-2 flex h-9 items-center gap-2 border-b border-[#c3c4d4] transition focus-within:border-[#28d8c6]">
                <input
                  className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#0B0B45] outline-none"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="text-slate-400 transition hover:text-[#28d8c6]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeIcon /> : <EyeSlashIcon />}
                </button>
              </span>
            </label>

            <label className="mt-4 flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-400">
              <input className="peer sr-only" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
              <span className="grid h-4 w-4 place-items-center rounded-full border border-[#28d8c6] transition peer-checked:bg-[#28d8c6]">
                {remember ? <CheckIcon /> : null}
              </span>
              Keep me logged in
            </label>

            {error ? (
              <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-center text-[11px] font-semibold text-red-500">{error}</p>
            ) : null}

            <button
              className="mt-6 h-10 w-full rounded-full bg-[#8fe4dc] text-xs font-extrabold uppercase tracking-wide text-white shadow-[0_14px_24px_rgba(79,211,203,0.4)] transition hover:bg-[#77ddd3] disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
              type="submit"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

            <p className="mt-6 text-center text-[11px] font-medium text-slate-300">Existing users only</p>
          </form>
        </div>
      </section>
    </main>
  );
}
