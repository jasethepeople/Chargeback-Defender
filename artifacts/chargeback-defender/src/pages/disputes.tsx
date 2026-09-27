import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ChevronRight, Filter, Search, SlidersHorizontal } from 'lucide-react';
import { useListDisputes } from '@workspace/api-client-react';
import type { ListDisputesStatus } from '@workspace/api-client-react';
import { AppShell, DeadlineBadge, formatMoney, PageHeader, QueryError, SkeletonBlock, StatusPill } from '@/components/app-shell';

const filters: { label: string; value: ListDisputesStatus }[] = [
  { label: 'All cases', value: 'all' },
  { label: 'Needs action', value: 'needs_action' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
];

export default function Disputes() {
  const [location] = useLocation();
  const initialStatus = new URLSearchParams(location.split('?')[1] ?? '').get('status') as ListDisputesStatus | null;
  const [status, setStatus] = useState<ListDisputesStatus>(initialStatus && filters.some((item) => item.value === initialStatus) ? initialStatus : 'all');
  const [search, setSearch] = useState('');
  const query = useListDisputes({ status, search: search || undefined });
  const results = query.data ?? [];
  const counts = useMemo(() => ({ all: results.length, needs_action: results.filter((item) => item.status === 'needs_action').length }), [results]);
  const exportView = () => {
    const rows = [['Order', 'Customer', 'Reason', 'Amount', 'Status'], ...results.map((item) => [item.orderNumber, item.customerName, item.reasonLabel, String(item.amount), item.statusLabel])];
    const blob = new Blob([rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'chargeback-defender-disputes.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return <AppShell>
    <PageHeader eyebrow="Chargeback desk" title="Disputes" description="Triage every incoming case, understand the proof gap, and move the right ones first." action={<div className="flex items-center gap-2 rounded-lg border border-[#b7d7cb] bg-[#e7f3ee] px-3 py-2 text-[11px] font-semibold text-[#32705e]"><span className="size-1.5 rounded-full bg-[#5fa58f]" />Sync healthy</div>} />
    <div className="rounded-[14px] border border-card-border bg-card">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-[310px]"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, email…" data-testid="input-dispute-search" className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10" /></div>
        <div className="flex items-center gap-2"><button type="button" data-testid="button-filters" onClick={() => setStatus(status === 'needs_action' ? 'all' : 'needs_action')} className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"><SlidersHorizontal size={14} /> {status === 'needs_action' ? 'Clear filters' : 'Priority filter'}</button><button type="button" data-testid="button-export-disputes" onClick={exportView} className="hidden rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground sm:inline-flex"><Filter size={14} className="mr-2" /> Export view</button></div>
      </div>
      <div className="scroll-thin flex gap-1 overflow-x-auto border-b border-border px-4 pt-3 sm:px-5">
        {filters.map((item) => <button type="button" key={item.value} data-testid={`button-filter-${item.value}`} onClick={() => setStatus(item.value)} className={`relative whitespace-nowrap px-2 pb-3 text-xs font-semibold transition-colors ${status === item.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>{item.label}{item.value === 'needs_action' && <span className="ml-1.5 font-mono text-[9px] opacity-70">{counts.needs_action || ''}</span>}{status === item.value && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />}</button>)}
      </div>
      {query.isLoading ? <div className="space-y-2 p-5"><SkeletonBlock className="h-14" /><SkeletonBlock className="h-14" /><SkeletonBlock className="h-14" /><SkeletonBlock className="h-14" /></div> : query.isError ? <div className="p-5"><QueryError onRetry={() => query.refetch()} /></div> : results.length === 0 ? <div className="grid min-h-[320px] place-items-center p-8 text-center"><div><div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#e7f3ee] text-[#32705e]"><Filter size={20} /></div><p className="font-display text-sm font-bold">{search ? 'No cases match that search' : status === 'needs_action' ? 'The action queue is clear' : 'No disputes in this view'}</p><p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{search ? 'Try a different order number, name, or email.' : 'When a case lands, it will appear here with a recommended next move.'}</p>{search && <button type="button" data-testid="button-clear-search" onClick={() => setSearch('')} className="mt-4 text-xs font-bold text-primary">Clear search</button>}</div></div> : <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-border bg-muted/30 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground"><th className="px-5 py-3 font-medium">Case / order</th><th className="px-3 py-3 font-medium">Reason</th><th className="px-3 py-3 font-medium">Amount</th><th className="px-3 py-3 font-medium">Deadline</th><th className="px-3 py-3 font-medium">Proof</th><th className="px-3 py-3 font-medium">Status</th><th className="px-4 py-3" /></tr></thead><tbody>{results.map((dispute) => <tr key={dispute.id} data-testid={`row-dispute-${dispute.id}`} className="group border-b border-border/70 last:border-0 hover:bg-muted/25"><td className="px-5 py-4"><Link href={`/disputes/${dispute.id}`} data-testid={`link-table-dispute-${dispute.id}`} className="flex items-center gap-3"><div className="grid size-9 place-items-center rounded-lg bg-muted font-mono text-[10px] font-medium text-muted-foreground">#{dispute.orderNumber.slice(-3)}</div><div className="min-w-0"><p className="text-xs font-bold">{dispute.customerName}</p><p className="mt-1 text-[11px] text-muted-foreground">{dispute.orderNumber} · {dispute.customerEmail}</p></div></Link></td><td className="px-3 py-4"><p className="text-xs font-semibold">{dispute.reasonLabel}</p><p className="mt-1 text-[10px] text-muted-foreground">{dispute.evidenceCount} sources found</p></td><td className="px-3 py-4 font-mono text-xs font-medium">{formatMoney(dispute.amount, dispute.currency)}</td><td className="px-3 py-4"><DeadlineBadge deadline={dispute.deadline} /></td><td className="px-3 py-4"><div className="flex items-center gap-2"><div className="h-1.5 w-14 rounded-full bg-muted"><div className={`h-full rounded-full ${dispute.evidenceReady ? 'w-full bg-[#69aa94]' : 'w-2/3 bg-primary'}`} /></div><span className="font-mono text-[10px] text-muted-foreground">{dispute.evidenceCount}</span></div></td><td className="px-3 py-4"><StatusPill label={dispute.statusLabel} status={dispute.status} /></td><td className="px-4 py-4 text-right"><ChevronRight size={16} className="ml-auto text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" /></td></tr>)}</tbody></table>
      </div>}
      {!query.isLoading && !query.isError && results.length > 0 && <div className="flex items-center justify-between border-t border-border px-5 py-3 font-mono text-[10px] text-muted-foreground"><span>Showing {results.length} cases</span><span>Updated just now</span></div>}
    </div>
  </AppShell>;
}