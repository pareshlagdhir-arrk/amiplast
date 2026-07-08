export default function DashboardPage() {
  return (
    <main className="flex min-h-[calc(100vh-52px)] items-center justify-center px-6">
      <section className="w-full max-w-[420px] overflow-hidden rounded border border-[#2f3549] bg-[#202331] p-10 text-center shadow-[0_24px_80px_rgba(0,0,0,0.4)]">
        <p className="text-sm uppercase tracking-[0.3em] text-[#7aa2f7]">Authenticated</p>
        <h1 className="mt-4 text-2xl font-bold text-[#d5dcff]">Welcome back</h1>
        <p className="mt-2 text-sm text-[#737aa2]">JWT login completed successfully.</p>
      </section>
    </main>
  );
}