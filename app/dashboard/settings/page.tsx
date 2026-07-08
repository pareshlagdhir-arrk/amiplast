'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppSettings, type AppSettingsData } from '@/components/dashboard/settings/app-settings';
import { CompanyInfo, type CompanyInfoData } from '@/components/dashboard/settings/company-info';

const defaultAppSettings: AppSettingsData = {
  appTitle: 'Amiplast',
  currency: 'MGA',
  position: 'suffix',
  numberFormat: 'fr',
  salesInvoiceStart: '1',
  purchaseInvoiceStart: '1',
  defaultMargin: '30',
};

const defaultCompanyInfo: CompanyInfoData = {
  name: '',
  address: '',
  city: '',
  country: '',
  email: '',
  phone: '',
};

export default function SettingsPage() {
  const [appSettings, setAppSettings] = useState<AppSettingsData>(defaultAppSettings);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoData>(defaultCompanyInfo);
  const [saved, setSaved] = useState(false);

  function handleSave() {
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
      </div>
    </main>
  );
}