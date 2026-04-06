"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, AlertTriangle, Info, AlertCircle } from "lucide-react";

interface LintIssue {
  type: string;
  page?: string;
  description: string;
  severity: "info" | "warning" | "error";
}

export default function LintPage() {
  const [issues, setIssues] = useState<LintIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLint = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lint", { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error || "Lint failed");
      const result = await res.json();
      setIssues(result.issues || []);
      setHasRun(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lint failed");
    }
    setLoading(false);
  };

  const severityIcon = (severity: string) => {
    switch (severity) {
      case "error": return <AlertCircle className="w-4 h-4 text-destructive" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const severityColor = (severity: string) => {
    switch (severity) {
      case "error": return "border-destructive/30 bg-destructive/5";
      case "warning": return "border-yellow-500/30 bg-yellow-500/5";
      default: return "border-primary/30 bg-primary/5";
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> Wiki Health Check
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Run LLM-powered lint to find issues in your wiki</p>
        </div>
        <button
          onClick={handleLint}
          disabled={loading}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Running...</> : "Run Health Check"}
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {hasRun && issues.length === 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-foreground font-medium">Wiki is healthy!</p>
          <p className="text-sm text-muted-foreground mt-1">No issues found.</p>
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{issues.length} issue(s) found</p>
          {issues.map((issue, i) => (
            <div key={i} className={`rounded-xl border p-4 ${severityColor(issue.severity)}`}>
              <div className="flex items-start gap-3">
                {severityIcon(issue.severity)}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded-md">{issue.type}</span>
                    {issue.page && (
                      <a href={`/wiki/${issue.page}`} className="text-xs text-primary hover:underline">{issue.page}</a>
                    )}
                  </div>
                  <p className="text-sm text-foreground mt-1">{issue.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!hasRun && !loading && (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Click &ldquo;Run Health Check&rdquo; to analyze your wiki for issues.</p>
        </div>
      )}
    </div>
  );
}
