# LLM Wiki

> Personal knowledge base powered by LLMs — inspired by [Andrej Karpathy's LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

A web-based implementation of Karpathy's "LLM Wiki" pattern: instead of traditional RAG, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files that compounds knowledge over time.

## Architecture

Three layers following Karpathy's design:

1. **Raw Sources** (`data/raw/`) — Immutable uploaded documents (PDF, MD, TXT, HTML)
2. **Wiki** (`data/wiki/`) — LLM-generated markdown pages with cross-links and frontmatter
3. **Schema** (`data/schema.md`) — Configuration defining wiki conventions and workflows

## Features

- **Dashboard** — Wiki stats, recent activity, quick actions
- **Wiki Browser** — Browse all pages with category filtering and tag display
- **Wiki Pages** — Markdown rendering with `[[wiki-link]]` support, inline editing
- **Graph View** — D3.js force-directed visualization of wiki page connections
- **Source Upload** — Drag & drop file upload with one-click LLM ingestion
- **Q&A Query** — Chat-style interface to query the wiki with citations
- **Lint / Health Check** — LLM-powered wiki analysis for orphans, gaps, contradictions
- **Operations Log** — Chronological record of all wiki operations

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** (dark theme)
- **react-markdown** + remark-gfm for wiki rendering
- **D3.js** for graph visualization
- **OpenAI API** (GPT-4o) for ingest/query/lint
- **File system** storage (local dev) / S3 (production)

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your OpenAI API key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. **Upload Sources** — Go to Sources, drag & drop or browse files
2. **Ingest** — Click "Ingest" on any uploaded source, LLM creates wiki pages
3. **Browse Wiki** — Navigate wiki pages with cross-references and markdown rendering
4. **Query** — Ask questions against your knowledge base
5. **Lint** — Run health checks to maintain wiki quality
6. **Graph** — Visualize connections between wiki pages

## Deployment (AWS)

Deploy via AWS Amplify:

```bash
# Connect Amplify to your GitHub repo
# Set environment variable: OPENAI_API_KEY
# Amplify auto-builds on push to main
```

## License

MIT

---

*Inspired by Andrej Karpathy's "LLM Wiki" idea file (April 2026)*
