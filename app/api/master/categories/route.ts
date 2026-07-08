import { listSimple, createSimple } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export async function GET() {
  return listSimple('categories');
}

export async function POST(request: Request) {
  return createSimple('categories', request);
}
