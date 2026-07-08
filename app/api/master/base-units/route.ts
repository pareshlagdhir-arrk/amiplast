import { listSimple, createSimple } from '@/lib/master/simple-entity';

export const runtime = 'nodejs';

export async function GET() {
  return listSimple('base_units');
}

export async function POST(request: Request) {
  return createSimple('base_units', request);
}
