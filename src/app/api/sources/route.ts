import { NextResponse } from 'next/server';
import { getRawSources } from '@/lib/storage';

export async function GET() {
  try {
    const sources = await getRawSources();
    return NextResponse.json(sources);
  } catch (error) {
    console.error('Sources list error:', error);
    return NextResponse.json({ error: 'Failed to list sources' }, { status: 500 });
  }
}
