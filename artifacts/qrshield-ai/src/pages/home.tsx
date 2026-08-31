import { ArrowRight, Clock3, FileScan, ShieldCheck, Sparkles, TriangleAlert } from 'lucide-react';
import { Link } from '@/lib/link';
import { useGetScanSummary, useListScans } from '@workspace/api-client-react';
import { EmptyState, ErrorState, RiskBadge, SectionEyebrow, SkeletonBlock } from '@/components/qr-ui';

function formatDate(value: string | null) {
  if (!value) return 'No scans yet';
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

export default function Home() {
  const summaryQuery = useGetScanSummary();
  const recentQuery = useListScans({ page: 1, pageSize: 4 });
  const summary = summaryQuery.data;
  const recent = recentQuery.data?.items ?? [];

  return (
    <div className="page-enter space-y-10">
      <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div><SectionEyebrow>Observation desk / 01</SectionEyebrow><h1 className="mt-3 max-w-xl font-display text-[clamp(2.6rem,6vw,5.3rem)] leading-[.92] tracking-[-.045em]">Pause before<br /><i>you visit.</i></h1><p className="mt-5 max-w-lg text-[14px] leading-7 text-muted-foreground">QRShield reads the code, studies its observable signals, and gives you a reasoned checkpoint before a browser ever opens.</p></div>
        <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--primary)/.25)] bg-[hsl(var(--primary)/.07)] px-3 py-2 font-mono-ui text-[10px] uppercase tracking-[.13em] text-[hsl(var(--primary))]" data-testid="status-privacy"><span className="size-1.5 rounded-full bg-current" />No destination calls from this app</div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <Link href="/scan" className="group relative min-h-[320px] overflow-hidden rounded-[1.65rem] bg-[hsl(var(--sidebar))] p-7 text-[hsl(var(--sidebar-foreground))] shadow-[var(--shadow-lg)] sm:p-10" data-testid="link-start-scan">
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div><div className="mb-8 grid size-12 place-items-center rounded-2xl bg-[hsl(var(--sidebar-primary)/.16)] text-[hsl(var(--sidebar-primary))]"><FileScan size={23} /></div><h2 className="max-w-md font-display text-4xl leading-none tracking-[-.025em] sm:text-5xl">Bring a code.<br /><span className="text-[hsl(var(--sidebar-primary))]">Leave with context.</span></h2><p className="mt-5 max-w-sm text-[13px] leading-relaxed text-[hsl(var(--sidebar-foreground)/.62)]">Upload a screenshot or camera capture. We decode locally in the analysis pipeline and keep the result in your session.</p></div>
            <span className="mt-9 inline-flex items-center gap-2 text-[12px] font-semibold text-[hsl(var(--sidebar-primary))]">Start a new scan <ArrowRight className="transition-transform group-hover:translate-x-1" size={16} /></span>
          </div>
          <div className="absolute -right-8 -top-10 size-64 rounded-full border border-[hsl(var(--sidebar-primary)/.17)]" /><div className="absolute -right-2 top-6 size-44 rounded-full border border-[hsl(var(--sidebar-primary)/.12)]" /><div className="absolute bottom-[-3.5rem] right-20 size-40 rotate-45 border border-[hsl(var(--accent)/.2)]" />
        </Link>
        <div className="rounded-[1.65rem] border border-border bg-card p-7 shadow-[var(--shadow-xs)] sm:p-8">
          <div className="flex items-center justify-between"><SectionEyebrow>Session pulse</SectionEyebrow><Clock3 size={17} className="text-muted-foreground" /></div>
          <div className="mt-10 space-y-6">
            {summaryQuery.isLoading ? <><SkeletonBlock className="h-12 w-28" /><SkeletonBlock className="h-4 w-40" /><SkeletonBlock className="h-12 w-28" /></> : summaryQuery.isError ? <ErrorState onRetry={() => summaryQuery.refetch()} detail="Session metrics are temporarily unavailable." /> : <><div><p className="font-display text-5xl tracking-[-.05em]" data-testid="metric-total-scans">{summary?.totalScans ?? 0}</p><p className="mt-1 text-[12px] text-muted-foreground">scans in this session</p></div><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-[hsl(var(--primary)/.08)] p-3"><ShieldCheck size={16} className="text-[hsl(var(--primary))]" /><p className="mt-3 text-2xl font-semibold" data-testid="metric-safe-scans">{summary?.safeScans ?? 0}</p><p className="text-[11px] text-muted-foreground">safe / low</p></div><div className="rounded-xl bg-[hsl(var(--destructive)/.07)] p-3"><TriangleAlert size={16} className="text-[hsl(var(--destructive))]" /><p className="mt-3 text-2xl font-semibold" data-testid="metric-high-risk-scans">{summary?.highRiskScans ?? 0}</p><p className="text-[11px] text-muted-foreground">high / critical</p></div></div><div className="border-t border-border pt-4"><p className="font-mono-ui text-[9px] uppercase tracking-[.14em] text-muted-foreground">Last observed</p><p className="mt-2 text-[12px]" data-testid="text-last-scan">{formatDate(summary?.lastScanAt ?? null)}</p></div></>}
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-4 flex items-end justify-between"><div><SectionEyebrow>Recent observations</SectionEyebrow><h2 className="mt-2 font-display text-3xl">Your latest reads</h2></div><Link href="/history" className="text-[12px] font-semibold text-[hsl(var(--primary))] hover:underline" data-testid="link-view-history">View history</Link></div>
          {recentQuery.isLoading ? <div className="space-y-2">{[1, 2, 3].map((n) => <SkeletonBlock key={n} className="h-[72px] w-full" />)}</div> : recentQuery.isError ? <ErrorState onRetry={() => recentQuery.refetch()} /> : recent.length === 0 ? <EmptyState title="The desk is clear" detail="Your scanned codes will appear here, with the evidence kept close at hand." action={<Link href="/scan" className="rounded-xl bg-primary px-4 py-2.5 text-[12px] font-semibold text-primary-foreground" data-testid="button-empty-scan">Scan your first code</Link>} /> : <div className="space-y-2">{recent.map((item) => <Link href={`/result/${item.id}`} key={item.id} className="lift group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-4" data-testid={`card-recent-${item.id}`}><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[hsl(var(--muted))] text-muted-foreground"><Sparkles size={17} /></div><div className="min-w-0 flex-1"><p className="truncate text-[13px] font-semibold">{item.preview || 'Untitled QR destination'}</p><p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.09em] text-muted-foreground">{item.contentType.replace('_', ' ')} · {formatDate(item.createdAt)}</p></div><RiskBadge level={item.riskLevel} score={item.riskScore} /><ArrowRight size={16} className="text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div>}
        </div>
        <aside className="self-start rounded-2xl border border-border bg-[hsl(var(--accent)/.08)] p-5"><div className="mb-4 flex items-center gap-2"><div className="grid size-8 place-items-center rounded-lg bg-[hsl(var(--accent)/.2)] text-[hsl(35_62%_32%)]"><Sparkles size={15} /></div><span className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-[hsl(35_62%_32%)]">A useful distinction</span></div><p className="text-[13px] leading-relaxed text-foreground/80">A risk score is deterministic. AI interpretation is an optional second opinion, always shown separately from the evidence.</p></aside>
      </section>
    </div>
  );
}