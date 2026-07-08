export interface AppSettingsData {
  appTitle: string;
  currency: string;
  position: 'prefix' | 'suffix';
  numberFormat: string;
  salesInvoiceStart: string;
  purchaseInvoiceStart: string;
  defaultMargin: string;
}

export interface CompanyInfoData {
  name: string;
  address: string;
  city: string;
  country: string;
  email: string;
  phone: string;
}

export interface Settings {
  app: AppSettingsData;
  company: CompanyInfoData;
}

export const DEFAULT_SETTINGS: Settings = {
  app: {
    appTitle: 'Amiplast',
    currency: 'Ar',
    position: 'suffix',
    numberFormat: 'fr',
    salesInvoiceStart: '1',
    purchaseInvoiceStart: '1',
    defaultMargin: '30',
  },
  company: {
    name: '',
    address: '',
    city: '',
    country: '',
    email: '',
    phone: '',
  },
};
