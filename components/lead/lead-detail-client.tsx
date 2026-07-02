'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Phone,
  ThumbsDown,
  Trophy,
} from 'lucide-react';
import {
  ACTIVITY_LABELS_AR,
  BUDGET_LABELS_AR,
  SOURCE_LABELS_AR,
  STAGE_LABELS_AR,
  api,
  ApiError,
} from '@/lib/api';
import { appConfig } from '@/lib/config';
import type { ActivityType, Lead, LeadStage } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';
import { cn } from '@/lib/utils';

const ALL_STAGES: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'MEETING_SCHEDULED',
  'MEETING_DONE',
  'PROPOSAL_SENT',
  'NEGOTIATION',
  'WON',
  'LOST',
  'GHOSTED',
];

function fmt(v: string | null | undefined): string {
  return v ? String(v) : '—';
}

export function LeadDetailClient({ lead: initial }: { lead: Lead }) {
  const [lead, setLead] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const dialog = useDialog();

  const [actType, setActType] = useState<ActivityType>('WHATSAPP');
  const [actNote, setActNote] = useState('');
  const [actOutcome, setActOutcome] = useState('');

  async function logActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!actNote.trim() && !actOutcome.trim()) {
      dialog.notify({ title: 'اكتب نتيجة أو ملاحظة على الأقل', tone: 'warn' });
      return;
    }
    start(async () => {
      try {
        await api.activities.log(lead.id, {
          type: actType,
          outcome: actOutcome || undefined,
          note: actNote || undefined,
        });
        setActNote('');
        setActOutcome('');
        const fresh = await api.leads.get(lead.id);
        setLead(fresh);
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل التسجيل',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  async function changeStage(next: LeadStage) {
    if (next === lead.stage) return;
    start(async () => {
      try {
        const updated = await api.leads.moveStage(lead.id, next);
        setLead(updated);
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل النقل',
          message: (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  async function scheduleMeeting() {
    const date = prompt('تاريخ الاجتماع (YYYY-MM-DD)');
    if (!date) return;
    const time = prompt('الوقت (HH:MM)');
    if (!time) return;
    start(async () => {
      try {
        const updated = await api.leads.scheduleMeeting(lead.id, {
          calendarSlug: appConfig.salesCalendarSlug,
          date,
          time,
        });
        setLead(updated);
        router.refresh();
        dialog.notify({ title: 'تم حجز الاجتماع', tone: 'success' });
      } catch (err) {
        dialog.notify({
          title: 'فشل الحجز',
          message: (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  async function markWon() {
    const confirm = await dialog.confirm({
      title: 'تأكيد الإغلاق الناجح',
      message: 'سيتم فتح صفحة العقود مع البيانات المعبأة.',
      confirmLabel: 'إغلاق ناجح',
      tone: 'success',
    });
    if (!confirm) return;
    start(async () => {
      try {
        const { lead: updated, deepLink } = await api.leads.markWon(lead.id, {});
        setLead(updated);
        router.refresh();
        window.open(deepLink, '_blank', 'noopener,noreferrer');
      } catch (err) {
        dialog.notify({
          title: 'فشل الإغلاق',
          message: (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  async function markLost() {
    const reason = prompt('سبب الخسارة (اختياري)');
    if (reason === null) return;
    start(async () => {
      try {
        const updated = await api.leads.markLost(lead.id, reason || undefined);
        setLead(updated);
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل الإغلاق',
          message: (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
      <div className="space-y-6">
        <div className="surface-strong p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="text-xs text-ink-400 ltr-inline">{lead.code}</div>
              <h2 className="text-xl font-semibold text-white">{lead.clientName}</h2>
              {lead.companyName && <div className="text-sm text-ink-300">{lead.companyName}</div>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={scheduleMeeting}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.02] px-3 py-1.5 text-sm text-ink-200 hover:bg-white/5"
              >
                <Calendar className="h-3.5 w-3.5" />
                حجز اجتماع
              </button>
              <button
                onClick={markWon}
                disabled={pending || lead.outcome === 'WON'}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500 text-ink-900 px-3 py-1.5 text-sm font-medium hover:bg-emerald-400 disabled:opacity-60"
              >
                <Trophy className="h-3.5 w-3.5" />
                فوز
              </button>
              <button
                onClick={markLost}
                disabled={pending || lead.outcome === 'LOST'}
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20 disabled:opacity-60"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
                خسارة
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <Detail label="الهاتف" value={lead.phone} ltr />
            <Detail label="البريد" value={lead.email} ltr />
            <Detail label="المصدر" value={SOURCE_LABELS_AR[lead.source]} />
            <Detail label="الحملة" value={lead.campaignName} />
            <Detail label="الميزانية" value={BUDGET_LABELS_AR[lead.budget]} />
            <Detail
              label="القيمة المتوقعة"
              value={lead.expectedValueSar ? `${lead.expectedValueSar.toLocaleString('en-US')} SAR` : null}
              ltr
            />
            <Detail label="المندوب" value={lead.assignedRepName} />
            <Detail label="المرحلة" value={STAGE_LABELS_AR[lead.stage]} />
            <Detail label="مجال العمل" value={lead.industry} />
            <Detail label="الجمهور المستهدف" value={lead.targetAudience} />
          </div>

          {lead.notes && (
            <div className="mt-4 rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-sm text-ink-200 whitespace-pre-wrap">
              {lead.notes}
            </div>
          )}
        </div>

        <div className="surface-strong p-5">
          <div className="text-sm font-medium text-white mb-3">تسجيل نشاط</div>
          <form onSubmit={logActivity} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(Object.keys(ACTIVITY_LABELS_AR) as ActivityType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setActType(t)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs',
                    actType === t
                      ? 'border-white/25 bg-white/[0.08] text-white'
                      : 'border-white/10 bg-white/[0.02] text-ink-300 hover:text-white',
                  )}
                >
                  {t === 'WHATSAPP' && <MessageSquare className="h-3 w-3" />}
                  {t === 'PHONE_CALL' && <Phone className="h-3 w-3" />}
                  {ACTIVITY_LABELS_AR[t]}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                value={actOutcome}
                onChange={(e) => setActOutcome(e.target.value)}
                placeholder="النتيجة (رد / لم يرد / تم الشرح ...)"
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100"
              />
              <input
                value={actNote}
                onChange={(e) => setActNote(e.target.value)}
                placeholder="ملاحظة"
                className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-3 py-2 text-sm font-medium hover:bg-ink-100 disabled:opacity-60"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                تسجيل
              </button>
            </div>
          </form>

          <div className="mt-5">
            <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">الجدول الزمني</div>
            <ul className="space-y-2">
              {(lead.activities ?? []).map((a) => (
                <li key={a.id} className="rounded-md border border-white/[0.06] bg-white/[0.015] p-3">
                  <div className="flex items-center justify-between text-xs text-ink-400">
                    <span>{ACTIVITY_LABELS_AR[a.type]}</span>
                    <span className="ltr-inline">{new Date(a.occurredAt).toLocaleString('en-GB')}</span>
                  </div>
                  {a.outcome && <div className="text-sm text-white mt-1">{a.outcome}</div>}
                  {a.note && <div className="text-sm text-ink-300 mt-1 whitespace-pre-wrap">{a.note}</div>}
                  {a.actorName && <div className="text-[11px] text-ink-500 mt-1">{a.actorName}</div>}
                </li>
              ))}
              {(!lead.activities || lead.activities.length === 0) && (
                <li className="text-sm text-ink-500 text-center py-6">لا يوجد نشاط بعد</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="surface-strong p-4">
          <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">تغيير المرحلة</div>
          <div className="grid grid-cols-2 gap-1.5">
            {ALL_STAGES.map((s) => (
              <button
                key={s}
                onClick={() => changeStage(s)}
                disabled={pending || s === lead.stage}
                className={cn(
                  'inline-flex items-center justify-between gap-1 rounded-md border px-2 py-1.5 text-xs',
                  s === lead.stage
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border-white/10 bg-white/[0.02] text-ink-300 hover:text-white',
                )}
              >
                <span>{STAGE_LABELS_AR[s]}</span>
                {s === lead.stage && <ArrowRight className="h-3 w-3" />}
              </button>
            ))}
          </div>
        </div>

        {lead.booking && (
          <div className="surface p-4">
            <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">اجتماع مسجل</div>
            <div className="text-sm text-white ltr-inline">
              {new Date(lead.booking.scheduledAt).toLocaleString('en-GB')}
            </div>
            <div className="text-xs text-ink-400 mt-1">
              {lead.booking.calendarType} · {lead.booking.status}
            </div>
          </div>
        )}

        <div className="surface p-4">
          <div className="text-xs uppercase tracking-wider text-ink-400 mb-2">سجل الأحداث</div>
          <ul className="space-y-1.5 text-xs">
            {(lead.events ?? []).slice().reverse().slice(0, 15).map((ev) => (
              <li key={ev.id} className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-ink-200">{ev.type}</div>
                  {ev.detail && <div className="text-ink-500">{ev.detail}</div>}
                  {ev.actorName && <div className="text-ink-500">{ev.actorName}</div>}
                </div>
                <span className="text-ink-500 ltr-inline shrink-0">
                  {new Date(ev.createdAt).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Detail({ label, value, ltr }: { label: string; value: string | null | undefined; ltr?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className={cn('text-white', ltr && 'ltr-inline')}>{fmt(value)}</div>
    </div>
  );
}
