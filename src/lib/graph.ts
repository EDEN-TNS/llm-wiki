import type { GraphData, WikiPage } from '@/types';
import { extractWikiLinks, slugify } from './utils';

export function buildGraphData(pages: WikiPage[]): GraphData {
  const pageMap = new Map(pages.map(p => [p.slug, p]));

  const nodes = pages.map(p => {
    const outLinks = extractWikiLinks(p.content);
    return {
      id: p.slug,
      title: p.title,
      category: p.frontmatter.category,
      linkCount: outLinks.length,
    };
  });

  const links: GraphData['links'] = [];
  const seen = new Set<string>();

  for (const page of pages) {
    const outLinks = extractWikiLinks(page.content);
    for (const target of outLinks) {
      const targetSlug = slugify(target);
      if (pageMap.has(targetSlug) && targetSlug !== page.slug) {
        const key = `${page.slug}->${targetSlug}`;
        if (!seen.has(key)) {
          seen.add(key);
          links.push({ source: page.slug, target: targetSlug });
        }
      }
    }
  }

  return { nodes, links };
}
