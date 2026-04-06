import { NextResponse } from 'next/server';
import { readWikiPage, writeWikiPage, rebuildIndex } from '@/lib/storage';
import type { WikiFrontmatter } from '@/types';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = await readWikiPage(slug);
    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    return NextResponse.json(page);
  } catch (error) {
    console.error('Wiki page read error:', error);
    return NextResponse.json({ error: 'Failed to read page' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { frontmatter, content } = await request.json();
    await writeWikiPage(slug, frontmatter as WikiFrontmatter, content);
    await rebuildIndex();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wiki page update error:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}
