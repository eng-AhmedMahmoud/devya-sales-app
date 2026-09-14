'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { api, ApiError, BUDGET_LABELS_AR, CLIENT_TYPE_LABELS_AR, SOURCE_LABELS_AR } from '@/lib/api';
import type { BudgetBucket, ClientType, LeadSource, TeamMember } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';

export function LeadForm({ team, isManager }: { team: TeamMember[]; isManager: boolean }) {
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
    clientType: 'COLD_LEAD' as ClientType,
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
          clientType: state.clientType,
          expectedValueSar: state.expectedValueSar ? Number(state.expectedValueSar) : undefined,
          // A rep never sends an owner: the backend pins the new lead to the
          // actor, and sending one would only look like a choice that isn't.
          assignedRepId: isManager ? state.assignedRepId || undefined : undefined,
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
    <form onSubmit={submit} className="surface-strong h-fit p-5 md:p-6 max-w-4xl">
      {/* Two columns from md up so an iPad fills the card instead of stacking
          narrow fields down one edge. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="اسم العميل" required>
          <input value={state.clientName} onChange={(e) => set('clientName', e.target.value)} required />
        </Field>
        <Field label="اسم الشركة">
          <input value={state.companyName} onChange={(e) => set('companyName', e.target.value)} />
        </Field>
        <Field label="المسمى الوظيفي">
          <input value={state.jobTitle} onChange={(e) => set('jobTitle', e.target.value)} />
        </Field>
        <Field label="رقم الهاتف">
          <input dir="ltr" inputMode="tel" value={state.phone} onChange={(e) => set('phone', e.target.value)} />
        </Field>
        <Field label="البريد">
          <input type="email" dir="ltr" value={state.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="الموقع الإلكتروني">
          <input dir="ltr" value={state.websiteUrl} onChange={(e) => set('websiteUrl', e.target.value)} />
        </Field>
        <Field label="مجال العمل">
          <input value={state.industry} onChange={(e) => set('industry', e.target.value)} />
        </Field>
        <Field label="الجمهور المستهدف">
          <input value={state.targetAudience} onChange={(e) => set('targetAudience', e.target.value)} />
        </Field>
        <Field label="المصدر">
          <select value={state.source} onChange={(e) => set('source', e.target.value as LeadSource)}>
            {Object.entries(SOURCE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="الحملة الإعلانية">
          <input value={state.campaignName} onChange={(e) => set('campaignName', e.target.value)} />
        </Field>
        <Field label="الميزانية المتوقعة">
          <select value={state.budget} onChange={(e) => set('budget', e.target.value as BudgetBucket)}>
            {Object.entries(BUDGET_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="نوع العميل">
          <select value={state.clientType} onChange={(e) => set('clientType', e.target.value as ClientType)}>
            {Object.entries(CLIENT_TYPE_LABELS_AR).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>
        <Field label="القيمة المتوقعة (ريال)">
          <input dir="ltr" type="number" min={0} inputMode="numeric" value={state.expectedValueSar}
            onChange={(e) => set('expectedValueSar', e.target.value)} />
        </Field>
        {isManager ? (
          <Field label="مندوب المبيعات">
            <select value={state.assignedRepId} onChange={(e) => set('assignedRepId', e.target.value)}>
              <option value="">— اختر —</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
              ))}
            </select>
          </Field>
        ) : (
          <div>
            <span className="form-label">مندوب المبيعات</span>
            <p className="text-base text-ink-200">سيُسنَد العميل إليك تلقائياً.</p>
          </div>
        )}
        <div className="md:col-span-2">
          <Field label="ملاحظات">
            <textarea value={state.notes} onChange={(e) => set('notes', e.target.value)} rows={4} />
          </Field>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/10 flex justify-end">
        <button type="submit" disabled={pending}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md bg-white text-ink-900 px-6 text-base font-semibold hover:bg-ink-200 disabled:opacity-60 ring-focus">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          حفظ العميل
        </button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="form-label">
        {label}
        {required && <span className="text-rose-300"> *</span>}
      </span>
      {children}
    </label>
  );
}
