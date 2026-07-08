import { Header } from '@/components/dashboard/header';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#1a1b26] text-[#c0caf5]">
      <Header />
      {children}
    </div>
  );
}