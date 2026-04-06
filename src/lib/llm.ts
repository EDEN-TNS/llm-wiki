import OpenAI from 'openai';
import type { IngestResult, QueryResult, LintResult } from '@/types';
import { readIndex, getWikiPages, readSchema } from './storage';
import { slugify, formatDate } from './utils';

/**
 * LLM Provider Configuration
 *
 * Supports two providers via environment variables:
 *
 * 1. Ollama (default) — local Qwen3 via OpenAI-compatible API
 *    LLM_PROVIDER=ollama
 *    LLM_BASE_URL=http://localhost:11434/v1  (default)
 *    LLM_MODEL=qwen3                         (default)
 *
 * 2. OpenAI — cloud API
 *    LLM_PROVIDER=openai
 *    OPENAI_API_KEY=sk-...
 *    LLM_MODEL=gpt-4o
 */

const PROVIDER = process.env.LLM_PROVIDER || 'ollama';
const MODEL = process.env.LLM_MODEL || (PROVIDER === 'ollama' ? 'qwen3' : 'gpt-4o');

function getClient(): OpenAI {
  if (PROVIDER === 'ollama') {
    return new OpenAI({
      baseURL: process.env.LLM_BASE_URL || 'http://localhost:11434/v1',
      apiKey: 'ollama', // Ollama doesn't need a real key
    });
  }
  // OpenAI or any other OpenAI-compatible provider
  return new OpenAI({
    baseURL: process.env.LLM_BASE_URL || undefined,
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * Strip Qwen3 thinking tags from response.
 * Qwen3 may wrap reasoning in <think>...</think> blocks.
 */
function stripThinkingTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

/**
 * For Qwen3/Ollama: prepend to user messages to disable
 * the thinking/reasoning mode and get direct JSON output.
 */
function wrapUserMessage(content: string): string {
  if (PROVIDER === 'ollama') {
    return `/no_think\n${content}`;
  }
  return content;
}

/**
 * Extract JSON from LLM response, handling:
 * - Direct JSON
 * - JSON in markdown code fences
 * - JSON after thinking tags
 */
function extractJSON<T>(text: string): T {
  const cleaned = stripThinkingTags(text);

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch { /* continue */ }

  // Try extracting from markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch { /* continue */ }
  }

  // Try extracting first JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  throw new Error('Failed to extract JSON from LLM response');
}

export async function ingestSource(sourceContent: string, sourceFilename: string): Promise<IngestResult> {
  const client = getClient();
  const schema = await readSchema();
  const index = await readIndex();
  const existingPages = await getWikiPages();

  const existingPagesList = existingPages
    .map(p => `- ${p.title} (${p.frontmatter.category || 'uncategorized'}): ${p.frontmatter.summary || ''}`)
    .join('\n');

  const systemPrompt = `You are a wiki maintainer. Your job is to ingest a raw source document and produce structured wiki pages.

${schema ? `## Wiki Schema\n${schema}\n` : ''}

## Current Index
${index}

## Existing Pages
${existingPagesList || 'None yet.'}

## Instructions
1. Read the source document carefully.
2. Extract key entities, concepts, and facts.
3. For each significant entity or concept, create or update a wiki page.
4. Each page must have YAML frontmatter with: title, tags, sources, created, updated, category (entity|concept|source|synthesis|comparison), summary.
5. Use [[Wiki Links]] to cross-reference between pages.
6. Create a source summary page for the raw document itself.
7. Return a JSON object with this exact structure:
{
  "summary": "Brief summary of what was ingested",
  "pages": [
    {
      "slug": "page-slug",
      "action": "create" or "update",
      "frontmatter": { "title": "...", "tags": [...], "sources": [...], "created": "...", "updated": "...", "category": "...", "summary": "..." },
      "content": "Markdown content with [[Wiki Links]]..."
    }
  ]
}

IMPORTANT: Return ONLY the JSON object. No markdown fences. No additional text.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: wrapUserMessage(`Ingest this source document (filename: ${sourceFilename}):\n\n${sourceContent}`) },
    ],
    temperature: 0.3,
    max_tokens: 16000,
  });

  const text = response.choices[0]?.message?.content || '{}';

  const parsed = extractJSON<{
    summary: string;
    pages: Array<{
      slug: string;
      action: string;
      frontmatter: Record<string, unknown>;
      content: string;
    }>;
  }>(text);

  const pagesCreated: string[] = [];
  const pagesUpdated: string[] = [];

  for (const page of parsed.pages || []) {
    const slug = slugify(page.slug || page.frontmatter.title as string || 'untitled');
    const fm = {
      ...page.frontmatter,
      updated: formatDate(),
      created: page.action === 'create' ? formatDate() : (page.frontmatter.created as string || formatDate()),
    };

    // Dynamic import to avoid circular deps
    const { writeWikiPage } = await import('./storage');
    await writeWikiPage(slug, fm as never, page.content);

    if (page.action === 'create') {
      pagesCreated.push(slug);
    } else {
      pagesUpdated.push(slug);
    }
  }

  return {
    summary: parsed.summary || 'Source ingested successfully.',
    pagesCreated,
    pagesUpdated,
  };
}

export async function queryWiki(question: string): Promise<QueryResult> {
  const client = getClient();
  const index = await readIndex();
  const pages = await getWikiPages();

  // Build wiki context — include all pages (for moderate scale this works well)
  const wikiContext = pages
    .map(p => `## ${p.title}\n_Category: ${p.frontmatter.category || 'uncategorized'}_\n\n${p.content}`)
    .join('\n\n---\n\n');

  const systemPrompt = `You are a knowledgeable assistant answering questions based on a personal wiki knowledge base.

## Wiki Index
${index}

## Wiki Content
${wikiContext || 'The wiki is empty. No pages have been created yet.'}

## Instructions
Answer the user's question based ONLY on the wiki content above.
- Cite specific wiki pages using [[Page Title]] format.
- If the wiki doesn't contain enough information, say so explicitly.
- Be thorough but concise.
- Return a JSON object:
{
  "answer": "Your detailed answer in markdown format with [[citations]]...",
  "citations": ["page-slug-1", "page-slug-2"],
  "suggestFile": true/false (true if this answer is valuable enough to save as a wiki page)
}

IMPORTANT: Return ONLY the JSON object. No markdown fences.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: wrapUserMessage(question) },
    ],
    temperature: 0.5,
    max_tokens: 4000,
  });

  const text = response.choices[0]?.message?.content || '{}';
  try {
    return extractJSON<QueryResult>(text);
  } catch {
    // Fallback: return the raw text as the answer
    return { answer: stripThinkingTags(text), citations: [], suggestFile: false };
  }
}

export async function lintWiki(): Promise<LintResult> {
  const client = getClient();
  const pages = await getWikiPages();
  const index = await readIndex();

  const wikiContext = pages
    .map(p => `## ${p.slug}.md\nTitle: ${p.title}\nCategory: ${p.frontmatter.category}\nTags: ${(p.frontmatter.tags || []).join(', ')}\nContent preview: ${p.content.slice(0, 500)}...`)
    .join('\n\n');

  const systemPrompt = `You are a wiki health checker. Analyze the wiki for issues.

## Wiki Index
${index}

## Wiki Pages
${wikiContext || 'No pages exist.'}

## Check for:
1. Orphan pages with no inbound [[links]] from other pages
2. Missing links (pages referenced via [[...]] that don't exist)
3. Potential contradictions between pages
4. Stale or outdated information
5. Important concepts mentioned but lacking their own page
6. Missing cross-references that should exist

Return a JSON object:
{
  "issues": [
    {
      "type": "orphan" | "missing-link" | "contradiction" | "stale" | "gap",
      "page": "affected-page-slug or null",
      "description": "Description of the issue",
      "severity": "info" | "warning" | "error"
    }
  ]
}

IMPORTANT: Return ONLY the JSON object.`;

  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: wrapUserMessage('Run a health check on this wiki.') },
    ],
    temperature: 0.3,
    max_tokens: 4000,
  });

  const text = response.choices[0]?.message?.content || '{}';
  try {
    return extractJSON<LintResult>(text);
  } catch {
    return { issues: [] };
  }
}
