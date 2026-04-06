"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MessageSquare, Send, Loader2, BookmarkPlus } from "lucide-react";

interface QueryResult {
  answer: string;
  citations: string[];
  suggestFile?: boolean;
}

interface QAEntry {
  question: string;
  result: QueryResult;
}

export default function QueryPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<QAEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Query failed");
      const result = await res.json();
      setHistory(prev => [...prev, { question, result }]);
      setQuestion("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Query failed");
    }
    setLoading(false);
  };

  const processWikiLinks = (text: string) => {
    return text.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const slug = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-");
      return `[${title}](/wiki/${slug})`;
    });
  };

  return (
    <div className="p-8 max-w-4xl flex flex-col h-screen">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Query Wiki
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Ask questions about your knowledge base</p>
      </div>

      {/* Q&A History */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {history.length === 0 && !loading && (
          <div className="text-center py-16">
            <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Ask a question to get started</p>
            <p className="text-xs text-muted-foreground mt-1">The LLM will search your wiki and synthesize an answer</p>
          </div>
        )}

        {history.map((entry, i) => (
          <div key={i} className="space-y-3">
            <div className="bg-primary/10 rounded-xl p-4">
              <p className="text-sm font-medium text-foreground">{entry.question}</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="wiki-content text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {processWikiLinks(entry.result.answer)}
                </ReactMarkdown>
              </div>
              {entry.result.citations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Citations:</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {entry.result.citations.map(c => (
                      <a key={c} href={`/wiki/${c}`} className="text-xs bg-secondary px-2 py-0.5 rounded-md text-primary hover:underline">{c}</a>
                    ))}
                  </div>
                </div>
              )}
              {entry.result.suggestFile && (
                <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                  <BookmarkPlus className="w-3 h-3" />
                  <span>This answer could be saved as a wiki page</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Searching wiki and synthesizing answer...
          </div>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-destructive mb-2">{error}</p>}

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleQuery()}
          placeholder="Ask a question about your wiki..."
          className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleQuery}
          disabled={!question.trim() || loading}
          className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
