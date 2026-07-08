import { SimpleEntityPage } from '@/components/dashboard/master/simple-entity-page';

export default function BaseUnitsPage() {
  return (
    <SimpleEntityPage title="base units" apiPath="/api/master/base-units" codeLabel="unit id" />
  );
}
