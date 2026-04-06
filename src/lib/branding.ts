/**
 * Whitelabel branding configuration.
 *
 * All values can be overridden via NEXT_PUBLIC_BRAND_* environment variables.
 * This allows the same codebase to serve multiple branded instances.
 *
 * Example .env.local:
 *   NEXT_PUBLIC_BRAND_APP_NAME=IntuaOS Wiki
 *   NEXT_PUBLIC_BRAND_TAGLINE=AI-powered knowledge base
 *   NEXT_PUBLIC_BRAND_LOGO_URL=/logo.svg
 *   NEXT_PUBLIC_BRAND_FAVICON_URL=/favicon.ico
 *   NEXT_PUBLIC_BRAND_PRIMARY_COLOR=#3b82f6
 *   NEXT_PUBLIC_BRAND_FOOTER_TEXT=Powered by IntuaOS
 *   NEXT_PUBLIC_BRAND_FOOTER_LINK=https://intuaos.com
 *   NEXT_PUBLIC_BRAND_SHOW_KARPATHY_CREDIT=true
 */

export interface BrandingConfig {
  appName: string;
  tagline: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  footerText: string;
  footerLink: string | null;
  showKarpathyCredit: boolean;
  metaTitle: string;
  metaDescription: string;
}

const defaults: BrandingConfig = {
  appName: 'LLM Wiki',
  tagline: 'Knowledge Base',
  logoUrl: null, // null = use default BookOpen icon
  faviconUrl: null,
  primaryColor: '#3b82f6',
  footerText: '',
  footerLink: null,
  showKarpathyCredit: true,
  metaTitle: 'LLM Wiki',
  metaDescription: 'Personal knowledge base powered by LLMs',
};

function env(key: string): string | undefined {
  // NEXT_PUBLIC_ vars are inlined at build time
  const envMap: Record<string, string | undefined> = {
    APP_NAME: process.env.NEXT_PUBLIC_BRAND_APP_NAME,
    TAGLINE: process.env.NEXT_PUBLIC_BRAND_TAGLINE,
    LOGO_URL: process.env.NEXT_PUBLIC_BRAND_LOGO_URL,
    FAVICON_URL: process.env.NEXT_PUBLIC_BRAND_FAVICON_URL,
    PRIMARY_COLOR: process.env.NEXT_PUBLIC_BRAND_PRIMARY_COLOR,
    FOOTER_TEXT: process.env.NEXT_PUBLIC_BRAND_FOOTER_TEXT,
    FOOTER_LINK: process.env.NEXT_PUBLIC_BRAND_FOOTER_LINK,
    SHOW_KARPATHY_CREDIT: process.env.NEXT_PUBLIC_BRAND_SHOW_KARPATHY_CREDIT,
    META_TITLE: process.env.NEXT_PUBLIC_BRAND_META_TITLE,
    META_DESCRIPTION: process.env.NEXT_PUBLIC_BRAND_META_DESCRIPTION,
  };
  return envMap[key];
}

export function getBranding(): BrandingConfig {
  return {
    appName: env('APP_NAME') || defaults.appName,
    tagline: env('TAGLINE') || defaults.tagline,
    logoUrl: env('LOGO_URL') || defaults.logoUrl,
    faviconUrl: env('FAVICON_URL') || defaults.faviconUrl,
    primaryColor: env('PRIMARY_COLOR') || defaults.primaryColor,
    footerText: env('FOOTER_TEXT') || defaults.footerText,
    footerLink: env('FOOTER_LINK') || defaults.footerLink,
    showKarpathyCredit: env('SHOW_KARPATHY_CREDIT') !== 'false',
    metaTitle: env('META_TITLE') || env('APP_NAME') || defaults.metaTitle,
    metaDescription: env('META_DESCRIPTION') || defaults.metaDescription,
  };
}

// Singleton for client-side use
let _branding: BrandingConfig | null = null;

export function useBranding(): BrandingConfig {
  if (!_branding) {
    _branding = getBranding();
  }
  return _branding;
}
