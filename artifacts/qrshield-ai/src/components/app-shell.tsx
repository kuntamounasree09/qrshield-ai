import { type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { History, House, Menu, ScanLine, Settings, X } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { Link } from '@/lib/link';
import { useLanguage } from '@/lib/i18n';

const links = [
  { href: '/', labelKey: 'overview', icon: House },
  { href: '/scan', labelKey: 'newScan', icon: ScanLine },
  { href: '/history', labelKey: 'history', icon: History },
  { href: '/settings', labelKey: 'settings', icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="app-shell app-noise flex min-h-[100dvh] text-foreground">
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[252px] flex-col bg-[hsl(var(--sidebar))] px-5 py-6 text-[hsl(var(--sidebar-foreground))] transition-transform duration-200 md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between">
          <Link to="/" className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--sidebar-ring))]" data-testid="link-brand">
            <BrandMark />
          </Link>
           <button type="button" className="rounded-lg p-2 text-[hsl(var(--sidebar-foreground)/.65)] hover:bg-[hsl(var(--sidebar-accent))] md:hidden" onClick={() => setMobileOpen(false)} aria-label={t('closeNavigation')} data-testid="button-close-navigation">
            <X size={18} />
          </button>
        </div>
        <div className="mt-12">
          <p className="mb-3 px-3 font-mono-ui text-[9px] uppercase tracking-[.22em] text-[hsl(var(--sidebar-foreground)/.42)]">{t('workspace')}</p>
           <nav className="space-y-1" aria-label={t('primaryNavigation')}>
            {links.map(({ href, labelKey, icon: Icon }) => {
              const active = href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
              return (
                <Link to={href} key={href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${active ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-foreground))]' : 'text-[hsl(var(--sidebar-foreground)/.68)] hover:bg-[hsl(var(--sidebar-accent)/.72)] hover:text-[hsl(var(--sidebar-foreground))]'}`} data-testid={`link-nav-${t(labelKey).toLowerCase().replace(' ', '-')}`}>
                  <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                  <span>{t(labelKey)}</span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto rounded-2xl border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-accent)/.42)] p-4">
          <div className="mb-3 flex items-center gap-2 text-[hsl(var(--sidebar-primary))]">
            <span className="size-1.5 rounded-full bg-current" />
            <span className="font-mono-ui text-[9px] uppercase tracking-[.17em]">{t('localSession')}</span>
          </div>
          <p className="text-[12px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.6)]">{t('sessionHistory')}</p>
        </div>
        <p className="mt-5 px-1 font-mono-ui text-[9px] tracking-[.08em] text-[hsl(var(--sidebar-foreground)/.34)]">v1.0 · observation over assumption</p>
      </aside>
      {mobileOpen && <button type="button" aria-label={t('closeNavigationOverlay')} className="fixed inset-0 z-20 bg-[hsl(var(--foreground)/.24)] md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-navigation-overlay" />}
      <main className="min-w-0 flex-1">
        <header className="flex h-[72px] items-center justify-between border-b border-border/70 px-5 md:hidden">
          <Link to="/" data-testid="link-mobile-brand"><BrandMark compact /></Link>
           <button type="button" className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground" onClick={() => setMobileOpen(true)} aria-label={t('openNavigation')} data-testid="button-open-navigation"><Menu size={19} /></button>
        </header>
        <div className="mx-auto w-full max-w-[1360px] px-5 py-7 md:px-10 md:py-10 lg:px-14">{children}</div>
      </main>
    </div>
  );
}
