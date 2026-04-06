import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import type { WikiPage, WikiFrontmatter, RawSource, LogEntry, IndexEntry } from '@/types';
import { formatDate } from './utils';

const DATA_DIR = path.join(process.cwd(), 'data');
const WIKI_DIR = path.join(DATA_DIR, 'wiki');
const RAW_DIR = path.join(DATA_DIR, 'raw');
const INDEX_PATH = path.join(DATA_DIR, 'index.md');
const LOG_PATH = path.join(DATA_DIR, 'log.md');
const SCHEMA_PATH = path.join(DATA_DIR, 'schema.md');

// ---- Wiki Pages ----

export async function getWikiPages(): Promise<WikiPage[]> {
  await ensureDir(WIKI_DIR);
  const files = await fs.readdir(WIKI_DIR);
  const mdFiles = files.filter(f => f.endsWith('.md'));
  const pages = await Promise.all(mdFiles.map(f => readWikiPage(f.replace('.md', ''))));
  return pages.filter((p): p is WikiPage => p !== null);
}

export async function readWikiPage(slug: string): Promise<WikiPage | null> {
  const filePath = path.join(WIKI_DIR, `${slug}.md`);
  try {
    const rawContent = await fs.readFile(filePath, 'utf-8');
    const { data, content } = matter(rawContent);
    return {
      slug,
      title: (data as WikiFrontmatter).title || slug,
      content,
      frontmatter: data as WikiFrontmatter,
      rawContent,
    };
  } catch {
    return null;
  }
}

export async function writeWikiPage(slug: string, frontmatter: WikiFrontmatter, content: string): Promise<void> {
  await ensureDir(WIKI_DIR);
  const rawContent = matter.stringify(content, frontmatter);
  await fs.writeFile(path.join(WIKI_DIR, `${slug}.md`), rawContent, 'utf-8');
}

export async function deleteWikiPage(slug: string): Promise<void> {
  const filePath = path.join(WIKI_DIR, `${slug}.md`);
  try {
    await fs.unlink(filePath);
  } catch { /* ignore */ }
}

// ---- Raw Sources ----

export async function getRawSources(): Promise<RawSource[]> {
  await ensureDir(RAW_DIR);
  const files = await fs.readdir(RAW_DIR);
  const sources: RawSource[] = [];
  for (const filename of files) {
    if (filename.startsWith('.')) continue;
    const filePath = path.join(RAW_DIR, filename);
    const stat = await fs.stat(filePath);
    sources.push({
      filename,
      path: filePath,
      size: stat.size,
      type: path.extname(filename).slice(1) || 'unknown',
      uploadedAt: stat.birthtime.toISOString(),
      ingested: false, // TODO: track ingestion state
    });
  }
  return sources;
}

export async function readRawSource(filename: string): Promise<string> {
  const filePath = path.join(RAW_DIR, filename);
  return fs.readFile(filePath, 'utf-8');
}

export async function saveRawSource(filename: string, buffer: Buffer): Promise<void> {
  await ensureDir(RAW_DIR);
  await fs.writeFile(path.join(RAW_DIR, filename), buffer);
}

// ---- Index ----

export async function readIndex(): Promise<string> {
  try {
    return await fs.readFile(INDEX_PATH, 'utf-8');
  } catch {
    return '# Wiki Index\n\nNo pages yet.\n';
  }
}

export async function writeIndex(content: string): Promise<void> {
  await fs.writeFile(INDEX_PATH, content, 'utf-8');
}

export async function rebuildIndex(): Promise<void> {
  const pages = await getWikiPages();
  const grouped: Record<string, IndexEntry[]> = {};

  for (const page of pages) {
    const category = page.frontmatter.category || 'uncategorized';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({
      slug: page.slug,
      title: page.title,
      summary: page.frontmatter.summary || '',
      category,
    });
  }

  let md = '# Wiki Index\n\n';
  md += `_${pages.length} pages total. Last updated: ${formatDate()}_\n\n`;

  for (const [category, entries] of Object.entries(grouped).sort()) {
    md += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
    for (const entry of entries.sort((a, b) => a.title.localeCompare(b.title))) {
      md += `- [[${entry.title}]] — ${entry.summary}\n`;
    }
    md += '\n';
  }

  await writeIndex(md);
}

// ---- Log ----

export async function readLog(): Promise<string> {
  try {
    return await fs.readFile(LOG_PATH, 'utf-8');
  } catch {
    return '# Operations Log\n\n';
  }
}

export async function appendLog(entry: LogEntry): Promise<void> {
  const current = await readLog();
  const line = `## [${entry.date}] ${entry.type} | ${entry.title}\n\n${entry.details || ''}\n\n`;
  await fs.writeFile(LOG_PATH, current + line, 'utf-8');
}

// ---- Schema ----

export async function readSchema(): Promise<string> {
  try {
    return await fs.readFile(SCHEMA_PATH, 'utf-8');
  } catch {
    return '';
  }
}

// ---- Helpers ----

async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch { /* ignore */ }
}
