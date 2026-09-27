import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, CircleCheck, Clock3, CreditCard, Download, FileText, Info, MapPin, PackageCheck, RefreshCw, Send, ShieldCheck, UserRound } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetDashboardSummaryQueryKey, getGetDisputeQueryKey, getListDisputesQueryKey, useGenerateDisputeEvidence, useGetDispute, useSubmitDispute } from '@workspace/api-client-react';
import { AppShell, DeadlineBadge, formatMoney, PageHeader, QueryError, SkeletonBlock, StatusPill } from '@/components/app-shell';

function dateLabel(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DisputeDetail() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showAllEvidence, setShowAllEvidence] = useState(false);
  const [notice, setNotice] = useState('');
  const disputeQuery = useGetDispute(params.id);
  const generate = useGenerateDisputeEvidence();
  const submit = useSubmitDispute();
  const dispute = disputeQuery.data;

  if (disputeQuery.isLoading) return <AppShell><div className="space-y-5"><SkeletonBlock className="h-8 w-28" /><SkeletonBlock className="h-20" /><div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><SkeletonBlock className="h-[500px]" /><SkeletonBlock className="h-[500px]" /></div></div></AppShell>;
  if (disputeQuery.isError || !dispute) return <AppShell><QueryError title="This case could not be opened" onRetry={() => disputeQuery.refetch()} /></AppShell>;

  const ready = dispute.evidence.filter((item) => item.status !== 'missing').length;
  const missing = dispute.evidence.length - ready;
  const isSubmitted = dispute.status === 'submitted' || dispute.status === 'won' || Boolean(dispute.submittedAt);
  const displayedEvidence = showAllEvidence ? dispute.evidence : dispute.evidence.slice(0, 5);

  const handleGenerate = () => {
    setNotice('');
    generate.mutate({ id: dispute.id }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetDisputeQueryKey(dispute.id) });
        setNotice('Evidence package refreshed. All sources are up to date.');
      },
    });
  };
  const handleSubmit = () => {
    if (missing > 0 && !window.confirm(`This package has ${missing} missing source${missing === 1 ? '' : 's'}. Submit anyway?`)) return;
    submit.mutate({ id: dispute.id }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetDisputeQueryKey(dispute.id) });
        void queryClient.invalidateQueries({ queryKey: getListDisputesQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setNotice('Submitted to the payment processor. We’ll watch for the decision.');
      },
    });
  };

  const handlePreviewPdf = () => {
    const lines = [
      'CHARGEBACK DEFENDER',
      'Evidence brief',
      '',
      `${dispute.reasonLabel} · ${dispute.orderNumber}`,
      `Customer: ${dispute.customerName} · ${dispute.customerEmail}`,
      `Amount: ${formatMoney(dispute.amount, dispute.currency)}`,
      `Ordered: ${dispute.orderDate}`,
      `Delivered: ${dispute.deliveryDate}`,
      '',
      'Merchant statement',
      dispute.evidenceSummary,
      '',
      'Evidence sources',
      ...dispute.evidence.map((item) => `${item.status.toUpperCase()} — ${item.label}: ${item.detail}`),
      '',
      `Shipping address: ${dispute.shippingAddress}`,
      `Billing address: ${dispute.billingAddress}`,
      `Payment method: ${dispute.paymentMethod}`,
      `Tracking: ${dispute.carrier} · ${dispute.trackingNumber}`,
    ];
    const pdf = buildSimplePdf(lines);
    const url = URL.createObjectURL(pdf);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `chargeback-defender-${dispute.orderNumber.replace('#', '')}-evidence.pdf`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Evidence PDF downloaded. Review it before submission.');
  };

  return <AppShell>
    <div className="mb-6"><Link href="/disputes" data-testid="link-back-disputes" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"><ArrowLeft size={14} /> Back to disputes</Link></div>
    <PageHeader eyebrow={`Case ${dispute.id.slice(0, 8).toUpperCase()}`} title={dispute.orderNumber} description={`${dispute.customerName} · ${dispute.customerEmail}`} action={<div className="flex items-center gap-2"><StatusPill label={dispute.statusLabel} status={dispute.status} /><DeadlineBadge deadline={dispute.deadline} /></div>} />
    {notice && <div data-testid="status-notice" className="mb-5 flex items-center gap-2 rounded-[10px] border border-[#b7d7cb] bg-[#e7f3ee] px-4 py-3 text-xs font-semibold text-[#32705e]"><CircleCheck size={15} />{notice}</div>}
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <div className="space-y-5">
        <section className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary">Evidence workspace</p><h2 className="mt-2 font-display text-[21px] font-bold tracking-[-0.04em]">Build the case, not the story.</h2><p className="mt-2 max-w-lg text-xs leading-5 text-muted-foreground">{dispute.evidenceSummary}</p></div><div className="hidden size-11 place-items-center rounded-xl bg-[#e7f3ee] text-[#32705e] sm:grid"><ShieldCheck size={22} /></div></div>
          <div className="mt-6 flex items-center justify-between border-y border-border py-3"><div className="flex items-center gap-2 text-xs font-semibold"><span className="grid size-6 place-items-center rounded-full bg-[#d6eee4] text-[#32705e]"><Check size={13} /></span>{ready} of {dispute.evidence.length} sources ready</div><p className="font-mono text-[10px] text-muted-foreground">{dispute.pdfReady ? 'PDF ready to submit' : 'PDF building'}</p></div>
          <div className="mt-3 divide-y divide-border">{displayedEvidence.map((item) => <div key={item.id} data-testid={`evidence-item-${item.id}`} className="flex items-center gap-3 py-3.5"><div className={`grid size-8 shrink-0 place-items-center rounded-lg ${item.status === 'missing' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{item.type === 'tracking' || item.type === 'delivery_photo' ? <PackageCheck size={15} /> : item.type === 'order' || item.type === 'order_history' ? <FileText size={15} /> : <Info size={15} />}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold">{item.label}</p><p className="mt-1 truncate text-[11px] text-muted-foreground">{item.detail}</p></div><span className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] ${item.status === 'missing' ? 'text-primary' : 'text-[#4c8b78]'}`}>{item.status === 'missing' ? 'Missing' : item.status === 'verified' ? 'Verified' : 'Found'}</span></div>)}</div>
          {dispute.evidence.length > 5 && <button type="button" data-testid="button-toggle-evidence" onClick={() => setShowAllEvidence((current) => !current)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary">{showAllEvidence ? 'Show less' : `Show all ${dispute.evidence.length} sources`}<ChevronDown size={14} className={showAllEvidence ? 'rotate-180' : ''} /></button>}
        </section>
        <section className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between"><div><p className="font-display text-sm font-bold">Case preview</p><p className="mt-1 text-xs text-muted-foreground">What the processor will receive</p></div><button type="button" data-testid="button-download-preview" onClick={handlePreviewPdf} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-[11px] font-semibold text-muted-foreground hover:border-primary/40 hover:text-foreground"><Download size={13} /> Preview PDF</button></div>
          <div className="grid-surface rounded-[10px] border border-border bg-background p-5"><div className="flex items-center justify-between border-b border-border pb-4"><div className="flex items-center gap-2"><div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck size={15} /></div><span className="font-display text-xs font-bold">Chargeback Defender</span></div><span className="font-mono text-[9px] uppercase tracking-[.1em] text-muted-foreground">Evidence brief</span></div><div className="py-5"><p className="font-display text-base font-bold">{dispute.reasonLabel} · {dispute.orderNumber}</p><p className="mt-2 text-[11px] leading-5 text-muted-foreground">{dispute.evidenceSummary}</p></div><div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4"><div><p className="font-mono text-[9px] uppercase text-muted-foreground">Customer</p><p className="mt-1 text-[11px] font-semibold">{dispute.customerName}</p></div><div><p className="font-mono text-[9px] uppercase text-muted-foreground">Amount</p><p className="mt-1 text-[11px] font-semibold">{formatMoney(dispute.amount, dispute.currency)}</p></div><div><p className="font-mono text-[9px] uppercase text-muted-foreground">Ordered</p><p className="mt-1 text-[11px] font-semibold">{dateLabel(dispute.orderDate)}</p></div><div><p className="font-mono text-[9px] uppercase text-muted-foreground">Delivered</p><p className="mt-1 text-[11px] font-semibold">{dateLabel(dispute.deliveryDate)}</p></div></div></div>
        </section>
      </div>
      <div className="space-y-5">
        <section className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><p className="font-display text-sm font-bold">Recommended next move</p><p className="mt-1 text-xs text-muted-foreground">Operator decision</p></div><Clock3 size={17} className="text-primary" /></div><div className="rounded-xl border border-primary/20 bg-primary/5 p-4"><p className="font-display text-sm font-bold">{isSubmitted ? 'Package is with the processor' : missing ? 'Close the proof gap, then submit' : 'Ready to submit'}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{isSubmitted ? `Submitted ${dispute.submittedAt ? dateLabel(dispute.submittedAt) : 'recently'}. We’ll surface the decision here.` : missing ? `${missing} source${missing === 1 ? '' : 's'} still missing. You can submit now, or strengthen the package first.` : 'Every expected source is verified. This package is in a strong position.'}</p></div>{!isSubmitted && <div className="mt-4 grid gap-2"><button type="button" disabled={generate.isPending} data-testid="button-generate-evidence" onClick={handleGenerate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-bold transition-colors hover:border-primary/40 hover:text-primary disabled:opacity-50"><RefreshCw size={14} className={generate.isPending ? 'animate-spin' : ''} />{generate.isPending ? 'Refreshing sources…' : 'Refresh evidence'}</button><button type="button" disabled={submit.isPending} data-testid="button-submit-evidence" onClick={handleSubmit} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50"><Send size={14} />{submit.isPending ? 'Submitting package…' : 'Submit evidence package'}<ArrowUpRight size={13} /></button></div>}{isSubmitted && <div className="mt-4 flex items-center gap-2 rounded-lg bg-[#e7f3ee] px-3 py-2.5 text-xs font-semibold text-[#32705e]"><Check size={14} /> Package submitted successfully</div>}</section>
        <section className="rounded-[14px] border border-card-border bg-card p-5 sm:p-6"><p className="font-display text-sm font-bold">Order details</p><div className="mt-5 space-y-4"><DetailRow icon={UserRound} label="Customer" value={dispute.customerName} sub={dispute.customerEmail} /><DetailRow icon={MapPin} label="Shipping address" value={dispute.shippingAddress} /><DetailRow icon={MapPin} label="Billing address" value={dispute.billingAddress} /><DetailRow icon={CreditCard} label="Payment method" value={dispute.paymentMethod} /><DetailRow icon={PackageCheck} label="Delivery" value={`${dispute.carrier} · ${dispute.trackingNumber}`} sub={dateLabel(dispute.deliveryDate)} /></div></section>
        <div className="rounded-[14px] border border-border bg-muted/35 p-4"><p className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Deadline</p><div className="mt-3 flex items-center justify-between"><div><p className="font-display text-lg font-bold">{dateLabel(dispute.deadline)}</p><p className="mt-1 text-[11px] text-muted-foreground">Processor response due</p></div><DeadlineBadge deadline={dispute.deadline} /></div></div>
      </div>
    </div>
  </AppShell>;
}

function buildSimplePdf(lines: string[]) {
  const escapePdfText = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const content = [
    'BT',
    '/F1 10 Tf',
    '48 742 Td',
    ...lines.flatMap((line, index) => [
      index === 0 ? `/F1 15 Tf (${escapePdfText(line)}) Tj` : `/F1 10 Tf 0 -16 Td (${escapePdfText(line.slice(0, 112))}) Tj`,
    ]),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function DetailRow({ icon: Icon, label, value, sub }: { icon: typeof MapPin; label: string; value: string; sub?: string }) {
  return <div className="flex gap-3"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon size={15} /></div><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-semibold">{value}</p>{sub && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{sub}</p>}</div></div>;
}