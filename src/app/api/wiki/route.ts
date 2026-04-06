import { NextResponse } from 'next/server';
import { getWikiPages } from '@/lib/storage';

export async function GET() {
  try {
    const pages = await getWikiPages();
    const summaries = pages.map(p => ({
      slug: p.slug,
      title: p.title,
      category: p.frontmatter.category || 'uncategorized',
      summary: p.frontmatter.summary || '',
      tags: p.frontmatter.tags || [],
      updated: p.frontmatter.updated || '',
    }));
    return NextResponse.json(summaries);
  } catch (error) {
    console.error('Wiki list error:', error);
    return NextResponse.json({ error: 'Failed to list wiki pages' }, { status: 500 });
  }
}
