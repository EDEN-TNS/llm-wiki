export interface WikiPage {
  slug: string;
  title: string;
  content: string;
  frontmatter: WikiFrontmatter;
  rawContent: string; // includes frontmatter
}

export interface WikiFrontmatter {
  title: string;
  tags?: string[];
  sources?: string[];
  created?: string;
  updated?: string;
  category?: 'entity' | 'concept' | 'source' | 'synthesis' | 'comparison';
  summary?: string;
}

export interface RawSource {
  filename: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
  ingested: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  title: string;
  category?: string;
  linkCount: number;
}

export interface GraphLink {
  source: string;
  target: string;
}

export interface LogEntry {
  date: string;
  type: 'ingest' | 'query' | 'lint' | 'edit';
  title: string;
  details?: string;
}

export interface IndexEntry {
  slug: string;
  title: string;
  summary: string;
  category: string;
  sources?: number;
}

export interface IngestResult {
  summary: string;
  pagesCreated: string[];
  pagesUpdated: string[];
}

export interface QueryResult {
  answer: string;
  citations: string[];
  suggestFile?: boolean;
}

export interface LintResult {
  issues: LintIssue[];
}

export interface LintIssue {
  type: 'orphan' | 'missing-link' | 'contradiction' | 'stale' | 'gap';
  page?: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
}
