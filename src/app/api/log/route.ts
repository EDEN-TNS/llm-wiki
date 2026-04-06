import { NextResponse } from 'next/server';
import { readLog } from '@/lib/storage';

export async function GET() {
  try {
    const log = await readLog();
    return NextResponse.json({ content: log });
  } catch (error) {
    console.error('Log error:', error);
    return NextResponse.json({ error: 'Failed to read log' }, { status: 500 });
  }
}
