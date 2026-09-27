import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useGetDashboardSummary, useHealthCheck } from '@workspace/api-client-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Disputes', href: '/disputes', icon: ShieldCheck },
  { label: 'Activity', href: '/activity', icon: Activity },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [utilityNotice, setUtilityNotice] = useState('');
  const healthQuery = useHealthCheck();
  const summaryQuery = useGetDashboardSummary();
  const current = location.startsWith('/disputes') ? 'Disputes' : location === '/settings' ? 'Settings' : location === '/activity' ? 'Activity' : 'Overview';

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-[76px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
            <div className="relative grid size-8 place-items-center rounded-[10px] bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_7px_16px_-7px_hsl(16_77%_61%/.8)]">
              <ShieldCheck size={18} strokeWidth={2.5} />
              <span className="absolute -right-1 -top-1 size-2 rounded-full bg-[#9fe3c9]" />
            </div>
            <div>
              <div className="font-display text-[15px] font-bold tracking-[-0.03em]">Chargeback</div>
              <div className="-mt-0.5 font-display text-[15px] font-bold tracking-[-0.03em] text-sidebar-primary">Defender</div>
            </div>
          </Link>
          <button type="button" aria-label="Close navigation" data-testid="button-close-navigation" onClick={() => setMobileOpen(false)} className="rounded-md p-1 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 pb-3 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/40">Workspace</p>
          <nav className="space-y-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.label === current;
              return (
                <Link key={item.href} href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} onClick={() => setMobileOpen(false)} className={cn(
                  'group flex items-center justify-between rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors',
                  active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
                )}>
                  <span className="flex items-center gap-3"><Icon size={17} strokeWidth={active ? 2.25 : 1.8} /><span>{item.label}</span></span>
                  {item.label === 'Disputes' && <span className="rounded-md bg-sidebar-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-sidebar-primary">{summaryQuery.data?.openDisputes ?? '—'}</span>}
                </Link>
              );
            })}
          </nav>
          <p className="px-3 pb-3 pt-8 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/40">Manage</p>
          <nav className="space-y-1">
            <Link href="/settings" data-testid="link-nav-settings" onClick={() => setMobileOpen(false)} className={cn(
              'group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold transition-colors',
              current === 'Settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/60 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground',
            )}><Settings2 size={17} /><span>Settings</span></Link>
          </nav>
        </div>

        <div className="mt-auto px-4 pb-5">
          <div className="mb-4 rounded-[12px] border border-sidebar-border bg-sidebar-accent/45 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/45">Protection plan</span>
              <span className="size-1.5 rounded-full bg-[#9fe3c9]" />
            </div>
            <p className="text-xs font-semibold text-sidebar-foreground/90">{healthQuery.isError ? 'Sync needs attention' : healthQuery.isLoading ? 'Checking connection…' : 'Growth · Active'}</p>
            <div className="mt-3 h-1 rounded-full bg-sidebar-foreground/10"><div className="h-full w-[62%] rounded-full bg-sidebar-primary" /></div>
            <div className="mt-2 flex justify-between font-mono text-[9px] text-sidebar-foreground/45"><span>62% used</span><span>8 days left</span></div>
          </div>
          <button type="button" data-testid="button-account-menu" onClick={() => setUtilityNotice('Account controls are available in Settings.')} className="flex w-full items-center gap-3 rounded-[10px] px-2 py-2 text-left hover:bg-sidebar-accent">
            <div className="grid size-8 place-items-center rounded-full bg-[#d9a690] text-[11px] font-bold text-[#42251b]">AR</div>
            <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">Avery Rhodes</p><p className="truncate text-[10px] text-sidebar-foreground/45">northstar-supply</p></div>
            <ChevronDown size={15} className="text-sidebar-foreground/45" />
          </button>
        </div>
      </aside>

      {mobileOpen && <button type="button" aria-label="Close menu overlay" data-testid="button-menu-overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-[#17202b]/35 lg:hidden" />}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-border/80 bg-background/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Open navigation" data-testid="button-open-navigation" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted lg:hidden"><Menu size={19} /></button>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span>Northstar Supply Co.</span><span className="text-border">/</span><span className="font-semibold text-foreground">{current}</span></div>
            <div className="flex items-center gap-2 sm:hidden"><div className="size-2 rounded-full bg-primary" /><span className="font-display text-sm font-bold">{current}</span></div>
          </div>
          <div className="flex items-center gap-2.5">
            <button type="button" data-testid="button-global-search" onClick={() => setUtilityNotice('Search is available from the Disputes queue.')} className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground md:flex"><Search size={14} /><span className="pr-8">Search</span><kbd className="font-mono text-[9px] text-muted-foreground/70">⌘K</kbd></button>
            <button type="button" aria-label="Help center" data-testid="button-help" onClick={() => setUtilityNotice('Recovery specialists are online from 9am–6pm PT.')} className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><CircleHelp size={17} /></button>
            <button type="button" aria-label="Notifications" data-testid="button-notifications" onClick={() => setUtilityNotice('You are all caught up.')} className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"><Bell size={17} /><span className="absolute right-[7px] top-[6px] size-1.5 rounded-full bg-primary ring-2 ring-background" /></button>
            <Link href="/settings" data-testid="link-header-settings" className="hidden size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground sm:grid"><Settings2 size={16} /></Link>
          </div>
        </header>
        {utilityNotice && <div data-testid="utility-notice" className="fixed right-5 top-[86px] z-30 flex max-w-[300px] items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 text-xs font-semibold text-foreground shadow-lg"><span className="flex-1 leading-5">{utilityNotice}</span><button type="button" aria-label="Dismiss notice" data-testid="button-dismiss-notice" onClick={() => setUtilityNotice('')} className="text-muted-foreground hover:text-foreground"><X size={14} /></button></div>}
        <main className="min-h-[calc(100dvh-76px)] px-5 py-7 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
    <div><p className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h1 className="font-display text-[29px] font-bold tracking-[-0.045em] text-foreground sm:text-[34px]">{title}</h1>{description && <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>
    {action}
  </div>;
}

export function StatusPill({ label, status }: { label: string; status: string }) {
  const styles: Record<string, string> = {
    needs_action: 'border-primary/25 bg-primary/10 text-primary',
    submitted: 'border-[#adcfc4] bg-[#e4f2ed] text-[#2e6b5b]',
    won: 'border-[#adcfc4] bg-[#e4f2ed] text-[#2e6b5b]',
    lost: 'border-destructive/20 bg-destructive/10 text-destructive',
  };
  return <span data-testid={`status-pill-${status}`} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-medium', styles[status] ?? 'border-border bg-muted text-muted-foreground')}><span className="size-1.5 rounded-full bg-current" />{label}</span>;
}

export function DeadlineBadge({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const date = new Date(deadline);
  const days = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86400000));
  const urgent = days <= 3;
  return <span data-testid={`deadline-${deadline}`} className={cn('inline-flex items-center gap-1.5 font-mono text-[10px]', urgent ? 'text-primary' : 'text-muted-foreground')}><span className={cn('size-1.5 rounded-full', urgent ? 'bg-primary animate-pulse-line' : 'bg-[#8bbeb0]')} />{days === 0 ? 'Due today' : `${days}d ${compact ? '' : 'remaining'}`}</span>;
}

export function formatMoney(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} aria-label="Loading" data-testid="loading-skeleton" />;
}

export function QueryError({ onRetry, title = 'Something interrupted the feed' }: { onRetry: () => void; title?: string }) {
  return <div className="grid min-h-[260px] place-items-center rounded-[14px] border border-destructive/20 bg-destructive/5 p-8 text-center"><div><div className="mx-auto mb-3 grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive"><CreditCard size={19} /></div><p className="font-display text-sm font-bold">{title}</p><p className="mt-1 text-xs text-muted-foreground">The workspace could not load this view.</p><button type="button" data-testid="button-retry" onClick={onRetry} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-xs font-bold text-background transition-transform hover:-translate-y-0.5"><ArrowUpRight size={14} />Retry connection</button></div></div>;
}