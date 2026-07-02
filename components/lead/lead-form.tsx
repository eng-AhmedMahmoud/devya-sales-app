'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api, ApiError, BUDGET_LABELS_AR, SOURCE_LABELS_AR } from '@/lib/api';
import type { BudgetBucket, LeadSource, TeamMember } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';

export function LeadForm({ team }: { team: TeamMember[] }) {
  const router = useRouter();
  const dialog = useDialog();
  const [pending, start] = useTransition();
  const [state, setState] = useState({
    clientName: '',
    companyName: '',
    jobTitle: '',
    phone: '',
    email: '',
    websiteUrl: '',
    industry: '',
    targetAudience: '',
    notes: '',
    campaignName: '',
    source: 'FB' as LeadSource,
    budget: 'UNKNOWN' as BudgetBucket,
    expectedValueSar: '',
    assignedRepId: '',
  });

  function set<K extends keyof typeof state>(k: K, v: (typeof state)[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      try {
        const lead = await api.leads.create({
          clientName: state.clientName.trim(),
          companyName: state.companyName.trim() || undefined,
          jobTitle: state.jobTitle.trim() || undefined,
          phone: state.phone.trim() || undefined,
          email: state.email.trim() || undefined,
          websiteUrl: state.websiteUrl.trim() || undefined,
          industry: state.industry.trim() || undefined,
          targetAudience: state.targetAudience.trim() || undefined,
          notes: state.notes.trim() || undefined,
          campaignName: state.campaignName.trim() || undefined,
          source: state.source,
          budget: state.budget,
          expectedValueSar: state.expectedValueSar ? Number(state.expectedValueSar) : undefined,
          assignedRepId: state.assignedRepId || undefined,
        });
        router.push(`/leads/${lead.id}`);
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل الإنشاء',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
      <Field label="اسم العميل *" required>
        <input value={state.clientName} onChange={(e) => set('clientName', e.target.value)}
          required className={inputCls} />
      </Field>
      <Field label="اسم الشركة">
        <input value={state.companyName} onChange={(e) => set('companyName', e.target.value)} className={inputCls} />
      </Field>
      <Field label="المسمى الوظيفي">
        <input value={state.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} className={inputCls} />
      </Field>
      <Field label="رقم الهاتف">
        <input dir="ltr" value={state.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
      </Field>
      <Field label="البريد">
        <input type="email" dir="ltr" value={state.email} onChange={(e) => set('email', e.target.value)} className={inputCls} />
      </Field>
      <Field label="الموقع">
        <input dir="ltr" value={state.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} className={inputCls} />
      </Field>
      <Field label="مجال العمل">
        <input value={state.industry} onChange={(e) => set('industry', e.target.value)} className={inputCls} />
      </Field>
      <Field label="الجمهور المستهدف">
        <input value={state.targetAudience} onChange={(e) => set('targetAudience', e.target.value)} className={inputCls} />
      </Field>
      <Field label="المصدر">
        <select value={state.source} onChange={(e) => set('source', e.target.value as LeadSource)} className={inputCls}>
          {Object.entries(SOURCE_LABELS_AR).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="الحملة الإعلانية">
        <input value={state.campaignName} onChange={(e) => set('campaignName', e.target.value)} className={inputCls} />
      </Field>
      <Field label="الميزانية المتوقعة">
        <select value={state.budget} onChange={(e) => set('budget', e.target.value as BudgetBucket)} className={inputCls}>
          {Object.entries(BUDGET_LABELS_AR).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </Field>
      <Field label="القيمة المتوقعة (ريال)">
        <input dir="ltr" type="number" min={0} value={state.expectedValueSar}
          onChange={(e) => set('expectedValueSar', e.target.value)} className={inputCls} />
      </Field>
      <Field label="مندوب المبيعات">
        <select value={state.assignedRepId} onChange={(e) => set('assignedRepId', e.target.value)} className={inputCls}>
          <option value="">— اختر —</option>
          {team.map((m) => (
            <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
          ))}
        </select>
      </Field>
      <div className="md:col-span-2">
        <Field label="ملاحظات">
          <textarea value={state.notes} onChange={(e) => set('notes', e.target.value)}
            rows={4} className={inputCls} />
        </Field>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <button type="submit" disabled={pending}
          className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-4 py-2 text-sm font-medium hover:bg-ink-100 disabled:opacity-60">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          حفظ العميل
        </button>
      </div>
    </form>
  );
}

const inputCls =
  'w-full rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 focus:border-white/25 focus:bg-white/[0.05] ring-focus';

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-ink-300 mb-1">
        {label}
        {required && <span className="text-rose-300"> *</span>}
      </span>
      {children}
    </label>
  );
}
