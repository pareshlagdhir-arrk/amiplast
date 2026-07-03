export default function DashboardPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center shadow-glass backdrop-blur-xl">
        <p className="text-sm uppercase tracking-[0.4em] text-orange-300">Authenticated</p>
        <h1 className="mt-4 text-4xl font-bold">Welcome back</h1>
        <p className="mt-3 text-white/65">JWT login completed successfully.</p>
      </section>
    </main>
  );
}
