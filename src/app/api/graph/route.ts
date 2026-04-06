import { NextResponse } from 'next/server';
import { getWikiPages } from '@/lib/storage';
import { buildGraphData } from '@/lib/graph';

export async function GET() {
  try {
    const pages = await getWikiPages();
    const graphData = buildGraphData(pages);
    return NextResponse.json(graphData);
  } catch (error) {
    console.error('Graph error:', error);
    return NextResponse.json({ error: 'Failed to build graph' }, { status: 500 });
  }
}
