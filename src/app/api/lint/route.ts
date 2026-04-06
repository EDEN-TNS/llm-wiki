import { NextResponse } from 'next/server';
import { lintWiki } from '@/lib/llm';
import { appendLog } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export async function POST() {
  try {
    const result = await lintWiki();

    await appendLog({
      date: formatDate(),
      type: 'lint',
      title: 'Wiki health check',
      details: `Found ${result.issues.length} issues`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Lint error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Lint failed' },
      { status: 500 }
    );
  }
}
