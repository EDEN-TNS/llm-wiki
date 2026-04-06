import { NextResponse } from 'next/server';
import { ingestSource } from '@/lib/llm';
import { readRawSource, rebuildIndex, appendLog } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json({ error: 'filename is required' }, { status: 400 });
    }

    const sourceContent = await readRawSource(filename);
    const result = await ingestSource(sourceContent, filename);

    // Rebuild the index after ingestion
    await rebuildIndex();

    // Append to log
    await appendLog({
      date: formatDate(),
      type: 'ingest',
      title: filename,
      details: `${result.summary}\nPages created: ${result.pagesCreated.join(', ') || 'none'}\nPages updated: ${result.pagesUpdated.join(', ') || 'none'}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingest failed' },
      { status: 500 }
    );
  }
}
