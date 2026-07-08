'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppSettings } from '@/components/dashboard/settings/app-settings';
import { CompanyInfo } from '@/components/dashboard/settings/company-info';
import { DEFAULT_SETTINGS, type AppSettingsData, type CompanyInfoData } from '@/lib/settings';

export default function SettingsPage() {
  const [appSettings, setAppSettings] = useState<AppSettingsData>(DEFAULT_SETTINGS.app);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoData>(DEFAULT_SETTINGS.company);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) return;
      const data = await res.json();
      if (!active || !data.settings) return;
      setAppSettings({ ...DEFAULT_SETTINGS.app, ...data.settings.app });
      setCompanyInfo({ ...DEFAULT_SETTINGS.company, ...data.settings.company });
    })();
    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setError('');
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app: appSettings, company: companyInfo }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Save failed');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <main className="mx-auto max-w-[680px] px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#d5dcff]">App Settings</h1>
        <p className="mt-1 text-sm text-[#737aa2]">~/dashboard/settings &gt; configure</p>
      </div>

      <div className="space-y-6">
        <AppSettings data={appSettings} onChange={setAppSettings} />
        <CompanyInfo data={companyInfo} onChange={setCompanyInfo} />
      </div>

      <div className="mt-8 flex items-center gap-4">
        <Button onClick={handleSave}>save settings</Button>
        {saved && <span className="text-sm text-[#7aa2f7]">settings saved.</span>}
        {error && <span className="text-sm text-[#f7768e]">{error}</span>}
      </div>
    </main>
  );
}
