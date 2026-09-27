import { Link } from 'wouter';
import { ArrowRight, Check, ChevronRight, CircleDollarSign, FileCheck2, ShieldAlert, TrendingUp } from 'lucide-react';
import { useGetDashboardActivity, useGetDashboardSummary, useListDisputes } from '@workspace/api-client-react';
import { AppShell, DeadlineBadge, formatMoney, PageHeader, QueryError, SkeletonBlock, StatusPill } from '@/components/app-shell';

function MetricCard({ label, value, detail, trend, tone = 'plain', icon: Icon }: { label: string; value: string; detail: string; trend?: string; tone?: 'plain' | 'accent' | 'mint'; icon: typeof TrendingUp }) {
  return <div className={`group relative overflow-hidden rounded-[14px] border p-5 transition-transform duration-300 hover:-translate-y-0.5 ${tone === 'accent' ? 'border-primary/30 bg-primary text-primary-foreground' : tone === 'mint' ? 'border-[#b7d7cb] bg-[#e7f3ee]' : 'border-card-border bg-card'}`}>
    <div className="flex items-start justify-between"><p className={`font-mono text-[10px] uppercase tracking-[0.13em] ${tone === 'accent' ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{label}</p><div className={`grid size-8 place-items-center rounded-lg ${tone === 'accent' ? 'bg-primary-foreground/15' : tone === 'mint' ? 'bg-[#cde8dc] text-[#32705e]' : 'bg-muted text-muted-foreground'}`}><Icon size={15} /></div></div>
    <div className="mt-6 flex items-end justify-between gap-2"><p data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`} className={`font-display text-[30px] font-bold tracking-[-0.06em] ${tone === 'accent' ? 'text-primary-foreground' : 'text-foreground'}`}>{value}</p>{trend && <span className={`mb-1 rounded-md px-1.5 py-1 font-mono text-[10px] font-medium ${tone === 'accent' ? 'bg-primary-foreground/15 text-primary-foreground' : 'bg-[#d8eee5] text-[#32705e]'}`}>{trend}</span>}</div>
    <p className={`mt-1 text-[11px] ${tone === 'accent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{detail}</p>
  </div>;
}

function RecoveryChart({ points }: { points: { month: string; recovered: number; disputes: number }[] }) {
  const max = Math.max(...points.map((point) => point.recovered), 1);
  return <div className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6">
    <div className="flex items-start justify-between gap-4"><div><p className="font-display text-sm font-bold">Recovery pace</p><p className="mt-1 text-xs text-muted-foreground">Recovered revenue across the last six months</p></div><div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-primary" />Recovered</span><span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-[#86b8a9]" />Cases</span></div></div>
    <div className="mt-8 flex h-[170px] items-end gap-2.5 sm:gap-5">
      {points.map((point) => <div key={point.month} className="group flex h-full flex-1 flex-col justify-end gap-2"><div className="relative flex h-[135px] items-end justify-center gap-1"><div title={`${formatMoney(point.recovered)} recovered`} style={{ height: `${Math.max(10, (point.recovered / max) * 100)}%` }} className="w-1/2 rounded-t-[5px] bg-primary/85 transition-all duration-500 group-hover:bg-primary" /><div title={`${point.disputes} disputes`} style={{ height: `${Math.max(10, (point.disputes / Math.max(...points.map((item) => item.disputes), 1)) * 100)}%` }} className="w-1/4 rounded-t-[5px] bg-[#86b8a9]/75 transition-all duration-500 group-hover:bg-[#6ba795]" /></div><span className="text-center font-mono text-[9px] uppercase text-muted-foreground">{point.month}</span></div>)}
    </div>
  </div>;
}

export default function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const activityQuery = useGetDashboardActivity();
  const queueQuery = useListDisputes({ status: 'needs_action' });

  const summary = summaryQuery.data;
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date());
  return <AppShell>
    <PageHeader eyebrow={today} title="Good morning, Avery." description="Your chargeback desk is clear enough to think. Here’s where recovery stands." action={<Link href="/disputes" data-testid="link-view-queue" className="inline-flex items-center justify-center gap-2 rounded-[9px] bg-foreground px-4 py-2.5 text-xs font-bold text-background transition-transform hover:-translate-y-0.5">Open dispute queue <ArrowRight size={14} /></Link>} />
    {summaryQuery.isLoading ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SkeletonBlock className="h-[148px]" /><SkeletonBlock className="h-[148px]" /><SkeletonBlock className="h-[148px]" /><SkeletonBlock className="h-[148px]" /></div> : summaryQuery.isError ? <QueryError onRetry={() => summaryQuery.refetch()} /> : summary ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Win rate" value={`${summary.winRate}%`} detail="of submitted disputes won" trend={`+${summary.winRateChange} pts`} icon={TrendingUp} tone="accent" />
        <MetricCard label="Recovered" value={formatMoney(summary.recoveredAmount)} detail="recovered this quarter" trend={`+${summary.recoveredChange}%`} icon={CircleDollarSign} tone="mint" />
        <MetricCard label="Open disputes" value={String(summary.openDisputes).padStart(2, '0')} detail="need an operator decision" icon={ShieldAlert} />
        <MetricCard label="Submitted" value={String(summary.submittedThisMonth).padStart(2, '0')} detail="packages sent this month" icon={FileCheck2} />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <RecoveryChart points={summary.monthlyRecovery} />
        <div className="grid-surface rounded-[14px] border border-[#d2e4db] bg-[#eaf4ef] p-5 sm:p-6">
          <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#528575]">Operator signal</p><p className="mt-3 max-w-[260px] font-display text-[23px] font-bold leading-[1.08] tracking-[-0.055em] text-[#1f5145]">Your best recovery week is ahead.</p></div><div className="grid size-9 place-items-center rounded-full bg-[#cde8dc] text-[#32705e]"><TrendingUp size={17} /></div></div>
          <p className="mt-7 max-w-[320px] text-xs leading-5 text-[#528575]">Evidence-ready cases are moving 18% faster than last month. Keep the queue under 10 to protect your win rate.</p>
          <Link href="/disputes?status=needs_action" data-testid="link-review-priority" className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#2f6b5c] hover:text-[#1f5145]">Review priority cases <ArrowRight size={13} /></Link>
        </div>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <section className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="font-display text-sm font-bold">Needs your attention</p><p className="mt-1 text-xs text-muted-foreground">The cases with the nearest deadlines</p></div><Link href="/disputes?status=needs_action" data-testid="link-see-all-disputes" className="flex items-center gap-1 text-[11px] font-semibold text-primary">See all <ChevronRight size={14} /></Link></div>
          {queueQuery.isLoading ? <div className="space-y-3"><SkeletonBlock className="h-14" /><SkeletonBlock className="h-14" /><SkeletonBlock className="h-14" /></div> : queueQuery.isError ? <QueryError title="Queue unavailable" onRetry={() => queueQuery.refetch()} /> : queueQuery.data?.length ? <div className="divide-y divide-border">{queueQuery.data.slice(0, 4).map((dispute) => <Link href={`/disputes/${dispute.id}`} data-testid={`link-dispute-${dispute.id}`} key={dispute.id} className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-mono text-[10px] font-medium text-muted-foreground">#{dispute.orderNumber.slice(-3)}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-xs font-bold">{dispute.customerName}</p><StatusPill label={dispute.statusLabel} status={dispute.status} /></div><p className="mt-1 truncate text-[11px] text-muted-foreground">{dispute.reasonLabel} · {formatMoney(dispute.amount, dispute.currency)}</p></div><div className="hidden text-right sm:block"><DeadlineBadge deadline={dispute.deadline} /><p className="mt-1 font-mono text-[10px] text-muted-foreground">{dispute.evidenceCount} sources</p></div><ChevronRight size={15} className="text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></Link>)}</div> : <div className="rounded-lg bg-muted/50 p-6 text-center text-xs text-muted-foreground">No open cases. A rare and welcome sight.</div>}
        </section>
        <section className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="font-display text-sm font-bold">Recent activity</p><p className="mt-1 text-xs text-muted-foreground">A quiet log of important moves</p></div><Link href="/activity" data-testid="link-see-activity" className="text-[11px] font-semibold text-primary">View log</Link></div>
          {activityQuery.isLoading ? <div className="space-y-4"><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /><SkeletonBlock className="h-12" /></div> : activityQuery.isError ? <QueryError title="Activity unavailable" onRetry={() => activityQuery.refetch()} /> : <div className="space-y-4">{activityQuery.data?.slice(0, 4).map((item) => <div key={item.id} data-testid={`activity-item-${item.id}`} className="flex gap-3"><div className={`mt-1.5 size-2 shrink-0 rounded-full ${item.tone === 'positive' ? 'bg-[#68a994]' : item.tone === 'warning' ? 'bg-primary' : 'bg-muted-foreground/40'}`} /><div className="min-w-0"><p className="text-xs font-semibold leading-4">{item.title}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{item.description}</p><p className="mt-1 font-mono text-[9px] text-muted-foreground/70">{item.timestamp}</p></div></div>)}</div>}
        </section>
      </div>
    </> : <div className="rounded-[14px] border border-border bg-card p-10 text-center text-sm text-muted-foreground">No dashboard data yet.</div>}
  </AppShell>;
}