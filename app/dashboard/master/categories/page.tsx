import { SimpleEntityPage } from '@/components/dashboard/master/simple-entity-page';

export default function CategoriesPage() {
  return (
    <SimpleEntityPage title="categories" apiPath="/api/master/categories" codeLabel="category id" />
  );
}
