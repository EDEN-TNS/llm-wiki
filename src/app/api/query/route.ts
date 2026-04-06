import { NextResponse } from 'next/server';
import { queryWiki } from '@/lib/llm';
import { appendLog } from '@/lib/storage';
import { formatDate } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json({ error: 'question is required' }, { status: 400 });
    }

    const result = await queryWiki(question);

    await appendLog({
      date: formatDate(),
      type: 'query',
      title: question.slice(0, 80),
      details: `Citations: ${result.citations.join(', ') || 'none'}`,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Query failed' },
      { status: 500 }
    );
  }
}
