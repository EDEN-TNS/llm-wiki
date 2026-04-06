# LLM Wiki Schema

## Conventions

### Page Types
- **entity**: A specific thing (person, company, tool, dataset, model)
- **concept**: An idea, technique, or abstract topic
- **source**: Summary of a raw source document
- **synthesis**: Cross-cutting analysis combining multiple sources
- **comparison**: Side-by-side comparison of entities or concepts

### Frontmatter Format
Every wiki page must have YAML frontmatter:
```yaml
title: Page Title
tags: [tag1, tag2]
sources: [source-filename.md]
created: YYYY-MM-DD
updated: YYYY-MM-DD
category: entity | concept | source | synthesis | comparison
summary: One-line summary of the page
```

### Cross-References
- Use `[[Page Title]]` syntax for wiki links
- Every page should link to related pages
- Prefer linking to existing pages over creating new ones for minor mentions

### Writing Style
- Clear, concise, factual
- Lead with the most important information
- Use headers (##, ###) to structure long pages
- Include "See also" section at the bottom with related [[links]]

## Workflows

### Ingest
1. Read the raw source completely
2. Identify key entities, concepts, and claims
3. Create a source summary page
4. For each significant entity/concept: create or update its page
5. Add cross-references between all affected pages
6. Update the index
7. Append to the log

### Query
1. Read the index to identify relevant pages
2. Read the full content of relevant pages
3. Synthesize an answer with [[citations]]
4. Suggest filing the answer if it adds value to the wiki

### Lint
1. Check for orphan pages (no inbound links)
2. Check for broken wiki links (referenced pages that don't exist)
3. Look for contradictions between pages
4. Identify gaps (mentioned but unlinked concepts)
5. Flag stale information
