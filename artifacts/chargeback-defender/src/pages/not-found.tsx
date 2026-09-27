import { Link } from 'wouter';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function NotFound() {
  return <div className="grid min-h-[100dvh] place-items-center bg-background px-5"><div className="max-w-md text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-sidebar text-sidebar-primary"><ShieldCheck size={22} /></div><p className="mt-7 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Route not found</p><h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.06em]">This case file is blank.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">The page you’re looking for is not in this workspace. Let’s get you back to the desk.</p><Link href="/" data-testid="link-return-overview" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-xs font-bold text-background transition-transform hover:-translate-y-0.5"><ArrowLeft size={14} />Return to overview</Link></div></div>;
}
