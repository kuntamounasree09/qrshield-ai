import { AlertCircle, ArrowUpRight, Check, CircleHelp, ExternalLink, Info, Minus, ShieldAlert, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { RiskLevel } from '@workspace/api-client-react';

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[.2em] text-[hsl(var(--primary))]">{children}</p>;
}

export function RiskBadge({ level, score }: { level: RiskLevel; score?: number }) {
  const styles: Record<RiskLevel, string> = {
    safe: 'bg-[hsl(var(--primary)/.11)] text-[hsl(var(--primary))] border-[hsl(var(--primary)/.22)]',
    low: 'bg-[hsl(171_30%_90%)] text-[hsl(171_44%_28%)] border-[hsl(171_30%_78%)]',
    medium: 'bg-[hsl(var(--accent)/.18)] text-[hsl(35_62%_32%)] border-[hsl(var(--accent)/.34)]',
    high: 'bg-[hsl(var(--destructive)/.12)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/.28)]',
    critical: 'bg-[hsl(var(--destructive)/.18)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/.38)]',
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-ui text-[10px] uppercase tracking-[.12em] ${styles[level]}`} data-testid={`status-risk-${level}`}><span className="size-1.5 rounded-full bg-current" />{score !== undefined ? `${score} · ` : ''}{level}</span>;
}

export function ScoreRing({ score, level, size = 'lg' }: { score: number; level: RiskLevel; size?: 'sm' | 'lg' }) {
  const tone = level === 'safe' || level === 'low' ? 'hsl(var(--primary))' : level === 'medium' ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';
  const radius = size === 'lg' ? 49 : 34;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (Math.max(0, Math.min(score, 100)) / 100);
  return <div className={`relative ${size === 'lg' ? 'size-36' : 'size-24'}`} data-testid="metric-risk-score">
    <svg className="size-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={size === 'lg' ? 7 : 6} />
      <circle cx="60" cy="60" r={radius} fill="none" stroke={tone} strokeWidth={size === 'lg' ? 7 : 6} strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} />
    </svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <strong className={`${size === 'lg' ? 'text-4xl' : 'text-2xl'} font-semibold tracking-[-.06em]`}>{score}</strong>
      <span className="font-mono-ui text-[9px] uppercase tracking-[.12em] text-muted-foreground">risk score</span>
    </div>
  </div>;
}

export function ServiceState({ kind, title, detail }: { kind: 'available' | 'partial' | 'off' | 'error'; title: string; detail: string }) {
  const Icon = kind === 'available' ? Check : kind === 'off' ? Minus : kind === 'error' ? X : CircleHelp;
  const tone = kind === 'available' ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/.1)]' : kind === 'error' ? 'text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/.1)]' : 'text-[hsl(var(--accent))] bg-[hsl(var(--accent)/.14)]';
  return <div className="flex gap-3" data-testid={`status-service-${kind}`}>
    <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={14} /></span>
    <div><p className="text-[13px] font-semibold">{title}</p><p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{detail}</p></div>
  </div>;
}

export function EvidencePill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-md bg-[hsl(var(--muted))] px-2 py-1 font-mono-ui text-[10px] text-muted-foreground"><Info size={11} />{children}</span>;
}

export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-16 text-center" data-testid="state-empty">
    <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><ShieldCheck size={22} /></div>
    <h2 className="font-display text-2xl">{title}</h2><p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">{detail}</p>{action && <div className="mt-6">{action}</div>}
  </div>;
}

export function ErrorState({ onRetry, detail = 'We could not retrieve this view.' }: { onRetry?: () => void; detail?: string }) {
  return <div className="flex flex-col items-center rounded-2xl border border-[hsl(var(--destructive)/.24)] bg-[hsl(var(--destructive)/.05)] px-6 py-14 text-center" data-testid="state-error">
    <AlertCircle className="mb-3 text-[hsl(var(--destructive))]" size={26} /><h2 className="font-display text-2xl">A quiet interruption</h2><p className="mt-2 text-[13px] text-muted-foreground">{detail}</p>{onRetry && <button type="button" onClick={onRetry} className="mt-5 rounded-xl border border-border bg-card px-4 py-2 text-[12px] font-semibold hover-elevate" data-testid="button-retry">Try again</button>}
  </div>;
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[hsl(var(--muted))] ${className}`} aria-label="Loading" data-testid="state-loading" />;
}

export function SafeDestination({ value }: { value: string }) {
  return <div className="flex items-start gap-3 rounded-xl border border-border bg-[hsl(var(--muted)/.46)] p-3"><div className="mt-0.5 rounded-lg bg-card p-2 text-muted-foreground"><ExternalLink size={14} /></div><div className="min-w-0"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground">Decoded destination · not opened</p><p className="mt-1 break-all font-mono-ui text-[12px] leading-relaxed text-foreground" data-testid="text-decoded-content">{value}</p></div></div>;
}

export function ArrowLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[hsl(var(--primary))] hover:underline" data-testid={`link-${href.replace('/', '') || 'home'}`}>{children}<ArrowUpRight size={13} /></a>;
}

export function FindingIcon({ severity }: { severity: RiskLevel }) {
  return severity === 'safe' || severity === 'low' ? <ShieldCheck size={17} /> : severity === 'medium' ? <Info size={17} /> : <ShieldAlert size={17} />;
}

export function ResultSectionTitle({ icon: Icon, eyebrow, title, detail }: { icon: typeof Sparkles; eyebrow: string; title: string; detail?: string }) {
  return <div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><Icon size={17} /></span><div><SectionEyebrow>{eyebrow}</SectionEyebrow><h2 className="mt-1 font-display text-2xl">{title}</h2>{detail && <p className="mt-1 text-[12px] text-muted-foreground">{detail}</p>}</div></div>;
}
