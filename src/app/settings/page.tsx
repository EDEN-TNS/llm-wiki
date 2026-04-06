"use client";

import { useEffect, useState } from "react";
import { Settings, Palette, Type, Image as ImageIcon, Link2, Eye, Cpu, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useBranding } from "@/lib/branding";

interface LLMStatus {
  provider: string;
  model: string;
  baseUrl: string;
  connected: boolean;
  availableModels: string[];
}

export default function SettingsPage() {
  const branding = useBranding();
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then(r => r.json())
      .then(setLlmStatus)
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  const configEntries: Array<{
    label: string;
    envVar: string;
    value: string;
    icon: React.ReactNode;
  }> = [
    { label: "App Name", envVar: "NEXT_PUBLIC_BRAND_APP_NAME", value: branding.appName, icon: <Type className="w-4 h-4" /> },
    { label: "Tagline", envVar: "NEXT_PUBLIC_BRAND_TAGLINE", value: branding.tagline, icon: <Type className="w-4 h-4" /> },
    { label: "Meta Title", envVar: "NEXT_PUBLIC_BRAND_META_TITLE", value: branding.metaTitle, icon: <Type className="w-4 h-4" /> },
    { label: "Meta Description", envVar: "NEXT_PUBLIC_BRAND_META_DESCRIPTION", value: branding.metaDescription, icon: <Type className="w-4 h-4" /> },
    { label: "Logo URL", envVar: "NEXT_PUBLIC_BRAND_LOGO_URL", value: branding.logoUrl || "(default icon)", icon: <ImageIcon className="w-4 h-4" /> },
    { label: "Favicon URL", envVar: "NEXT_PUBLIC_BRAND_FAVICON_URL", value: branding.faviconUrl || "(default)", icon: <ImageIcon className="w-4 h-4" /> },
    { label: "Primary Color", envVar: "NEXT_PUBLIC_BRAND_PRIMARY_COLOR", value: branding.primaryColor, icon: <Palette className="w-4 h-4" /> },
    { label: "Footer Text", envVar: "NEXT_PUBLIC_BRAND_FOOTER_TEXT", value: branding.footerText || "(none)", icon: <Type className="w-4 h-4" /> },
    { label: "Footer Link", envVar: "NEXT_PUBLIC_BRAND_FOOTER_LINK", value: branding.footerLink || "(none)", icon: <Link2 className="w-4 h-4" /> },
    { label: "Show Karpathy Credit", envVar: "NEXT_PUBLIC_BRAND_SHOW_KARPATHY_CREDIT", value: String(branding.showKarpathyCredit), icon: <Eye className="w-4 h-4" /> },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Settings className="w-6 h-6" /> Settings
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Whitelabel branding configuration. Set these environment variables to customize the app.
      </p>

      {/* LLM Provider Status */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Cpu className="w-4 h-4" /> LLM Provider
        </h2>
        {statusLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking connection...
          </div>
        ) : llmStatus ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {llmStatus.connected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {llmStatus.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                {llmStatus.provider}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Model:</span> <span className="text-foreground font-mono">{llmStatus.model}</span></div>
              <div><span className="text-muted-foreground">Base URL:</span> <span className="text-foreground font-mono text-xs">{llmStatus.baseUrl}</span></div>
            </div>
            {llmStatus.availableModels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available models:</p>
                <div className="flex flex-wrap gap-1">
                  {llmStatus.availableModels.map(m => (
                    <span key={m} className={`text-xs px-2 py-0.5 rounded-md ${m === llmStatus.model ? 'bg-primary/20 text-primary font-medium' : 'bg-secondary text-muted-foreground'}`}>{m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-destructive">Failed to check LLM status</p>
        )}
      </div>

      {/* Live Preview */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h2 className="font-semibold text-foreground mb-3">Live Preview</h2>
        <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: branding.primaryColor }}
          >
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="" className="w-8 h-8 object-contain" />
            ) : (
              branding.appName.charAt(0)
            )}
          </div>
          <div>
            <p className="font-bold text-foreground">{branding.appName}</p>
            <p className="text-xs text-muted-foreground">{branding.tagline}</p>
          </div>
        </div>
        {branding.footerText && (
          <p className="text-xs text-muted-foreground mt-3">Footer: {branding.footerText}</p>
        )}
      </div>

      {/* Configuration Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-foreground">Environment Variables</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Add these to <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">.env.local</code> or your Amplify environment variables.
          </p>
        </div>
        <div className="divide-y divide-border">
          {configEntries.map((entry) => (
            <div key={entry.envVar} className="flex items-center gap-4 p-4">
              <div className="text-muted-foreground">{entry.icon}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{entry.label}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{entry.envVar}</p>
              </div>
              <div className="text-right">
                {entry.label === "Primary Color" ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: entry.value }}
                    />
                    <span className="text-sm text-foreground font-mono">{entry.value}</span>
                  </div>
                ) : (
                  <span className="text-sm text-foreground">{entry.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Example Config */}
      <div className="bg-card rounded-xl border border-border p-5 mt-6">
        <h2 className="font-semibold text-foreground mb-3">Example: IntuaOS Branding</h2>
        <pre className="bg-background rounded-lg p-4 text-xs font-mono text-muted-foreground overflow-x-auto">
{`# .env.local
NEXT_PUBLIC_BRAND_APP_NAME=IntuaOS Wiki
NEXT_PUBLIC_BRAND_TAGLINE=AI Knowledge Platform
NEXT_PUBLIC_BRAND_META_TITLE=IntuaOS Wiki
NEXT_PUBLIC_BRAND_META_DESCRIPTION=IntuaOS AI-powered knowledge base
NEXT_PUBLIC_BRAND_PRIMARY_COLOR=#6366f1
NEXT_PUBLIC_BRAND_FOOTER_TEXT=Powered by IntuaOS
NEXT_PUBLIC_BRAND_FOOTER_LINK=https://intuaos.com
NEXT_PUBLIC_BRAND_SHOW_KARPATHY_CREDIT=false`}
        </pre>
      </div>
    </div>
  );
}
