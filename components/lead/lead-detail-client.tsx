'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageSquare,
  Phone,
  Sparkles,
  ThumbsDown,
  Trophy,
  UserPlus,
} from 'lucide-react';
import {
  ACTIVITY_LABELS_AR,
  BUDGET_LABELS_AR,
  CLIENT_TYPE_LABELS_AR,
  CLIENT_TYPE_ORDER,
  SOURCE_LABELS_AR,
  STAGE_LABELS_AR,
  api,
  errorMessageAr,
} from '@/lib/api';
import { appConfig } from '@/lib/config';
import type { ActivityType, AuthUser, ClientType, Lead, LeadStage } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';
import { WhatsAppButton } from '@/components/lead/whatsapp-button';
import { NextActionsBlock } from '@/components/lead/next-actions';
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

function isManager(user: AuthUser) {
  return ['SALES_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

/**
 * `canWrite` is owner-or-manager, resolved on the server. A rep who reached
 * this lead through a visibility grant sees the same card with every mutation
 * control gone (spec §2.2) — the backend refuses them anyway, and an enabled
 * button that always fails is worse than no button.
 */
export function LeadDetailClient({
  lead: initial,
  user,
  canWrite,
}: {
  lead: Lead;
  user: AuthUser;
  canWrite: boolean;
}) {
  const [lead, setLead] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const dialog = useDialog();

  const [actType, setActType] = useState<ActivityType>('WHATSAPP');
  const [actNote, setActNote] = useState('');
  const [actOutcome, setActOutcome] = useState('');

  const repName = user.name ?? 'فريق ديڤيا';

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
          message: errorMessageAr(err),
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
          message: errorMessageAr(err),
          tone: 'danger',
        });
      }
    });
  }

  async function changeClientType(next: ClientType) {
    if (next === lead.clientType) return;
    start(async () => {
      try {
        const updated = await api.leads.setClientType(lead.id, next);
        setLead(updated);
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل تغيير نوع العميل',
          message: errorMessageAr(err),
          tone: 'danger',
        });
      }
    });
  }

  async function runAiScore() {
    start(async () => {
      try {
        const updated = await api.leads.aiScore(lead.id);
        setLead(updated);
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل التقييم الذكي',
          message: errorMessageAr(err),
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
          message: errorMessageAr(err),
          tone: 'danger',
        });
      }
    });
  }

  async function markWon() {
    const confirmed = await dialog.confirm({
      title: 'تأكيد الإغلاق الناجح',
      message: 'سيتم فتح صفحة العقود مع البيانات المعبأة.',
      confirmLabel: 'إغلاق ناجح',
      tone: 'success',
    });
    if (!confirmed) return;
    start(async () => {
      try {
        const { lead: updated, deepLink } = await api.leads.markWon(lead.id, {});
        setLead(updated);
        router.refresh();
        window.open(deepLink, '_blank', 'noopener,noreferrer');
      } catch (err) {
        dialog.notify({
          title: 'فشل الإغلاق',
          message: errorMessageAr(err),
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
          message: errorMessageAr(err),
          tone: 'danger',
        });
      }
    });
  }

  async function promoteToClient() {
    const confirmed = await dialog.confirm({
      title: 'إنشاء ملف عميل',
      message: `سيتم إنشاء / ربط ملف عميل لـ ${lead.clientName} من هذا العميل المحتمل.`,
      confirmLabel: 'إنشاء',
      tone: 'info',
    });
    if (!confirmed) return;
    start(async () => {
      try {
        const client = await api.clients.fromLead(lead.id);
        const clientUrl = `https://admin.devya-solutions.com/clients/${client.id}`;
        dialog.notify({
          title: `تم الربط بملف العميل · ${client.code}`,
          message: `انقر هنا للانتقال إلى صفحة العميل.`,
          tone: 'success',
        });
        window.open(clientUrl, '_blank', 'noopener,noreferrer');
        router.refresh();
      } catch (err) {
        dialog.notify({
          title: 'فشل إنشاء ملف العميل',
          message: errorMessageAr(err),
          tone: 'danger',
        });
      }
    });
  }

  const canPromote = canWrite && isManager(user) && !!lead.email;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
      <div className="space-y-5">
        <div className="surface-strong h-fit p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <div className="text-sm text-ink-300 ltr-inline">{lead.code}</div>
              <h2 className="text-xl font-semibold text-white">{lead.clientName}</h2>
              {lead.companyName && <div className="text-base text-ink-200">{lead.companyName}</div>}
              {/* WhatsApp quick-dial in header */}
              {lead.phone && (
                <div className="mt-1.5">
                  <WhatsAppButton
                    phone={lead.phone}
                    clientName={lead.clientName}
                    repName={repName}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {canPromote && (
                <button
                  onClick={promoteToClient}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-md border border-blue-400/45 bg-blue-500/15 px-4 text-sm font-medium text-blue-300 hover:bg-blue-500/25 disabled:opacity-60 ring-focus"
                >
                  <UserPlus className="h-4 w-4" />
                  إنشاء ملف عميل
                  <ExternalLink className="h-4 w-4 opacity-70" />
                </button>
              )}
              {canWrite && (
                <>
                  <button
                    onClick={scheduleMeeting}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.06] px-4 text-sm font-medium text-ink-100 hover:bg-white/[0.12] ring-focus"
                  >
                    <Calendar className="h-4 w-4" />
                    حجز اجتماع
                  </button>
                  <button
                    onClick={markWon}
                    disabled={pending || lead.outcome === 'WON'}
                    className="inline-flex items-center gap-2 rounded-md bg-emerald-500 text-ink-900 px-4 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60 ring-focus"
                  >
                    <Trophy className="h-4 w-4" />
                    فوز
                  </button>
                  <button
                    onClick={markLost}
                    disabled={pending || lead.outcome === 'LOST'}
                    className="inline-flex items-center gap-2 rounded-md border border-rose-400/45 bg-rose-500/15 px-4 text-sm font-medium text-rose-300 hover:bg-rose-500/25 disabled:opacity-60 ring-focus"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    خسارة
                  </button>
                </>
              )}
            </div>
          </div>

          {!canWrite && (
            <p className="mb-5 rounded-md border border-white/[0.18] bg-ink-760 p-3.5 text-base text-ink-200">
              هذا العميل مسند إلى {fmt(lead.assignedRepName)}. لديك صلاحية الاطلاع فقط.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-base">
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
            <Detail label="نوع العميل" value={CLIENT_TYPE_LABELS_AR[lead.clientType]} />
            <Detail label="مجال العمل" value={lead.industry} />
            <Detail label="الجمهور المستهدف" value={lead.targetAudience} />
          </div>

          <div className="mt-5 rounded-md border border-violet-400/35 bg-violet-500/[0.12] p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-violet-300" />
                <span className="font-semibold text-white">تقييم الذكاء الاصطناعي</span>
                {lead.aiScore != null && (
                  <span
                    dir="ltr"
                    className={cn(
                      'rounded-md border px-2.5 py-0.5 text-sm font-semibold',
                      lead.aiScore >= 70
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : lead.aiScore >= 40
                          ? 'border-amber-400/45 bg-amber-500/15 text-amber-300'
                          : 'border-rose-400/45 bg-rose-500/15 text-rose-300',
                    )}
                  >
                    {lead.aiScore}/100
                  </span>
                )}
              </div>
              {/* Scoring writes back to the lead, so it is a mutation too. */}
              {canWrite && (
                <button
                  onClick={runAiScore}
                  disabled={pending}
                  className="inline-flex items-center gap-2 rounded-md border border-violet-400/45 bg-violet-500/15 px-4 text-sm font-medium text-violet-200 hover:bg-violet-500/25 disabled:opacity-60 ring-focus"
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {lead.aiScore != null ? 'إعادة التقييم' : 'تقييم الآن'}
                </button>
              )}
            </div>
            {lead.aiQualification && (
              <p className="mt-2.5 text-base text-ink-100 whitespace-pre-wrap">{lead.aiQualification}</p>
            )}
          </div>

          {lead.notes && (
            <div className="mt-5 rounded-md border border-white/[0.18] bg-ink-760 p-4 text-base text-ink-100 whitespace-pre-wrap">
              {lead.notes}
            </div>
          )}
        </div>

        {/* Next actions — free-text reminders pinned to this client */}
        <NextActionsBlock leadId={lead.id} initial={lead.nextActions ?? []} canWrite={canWrite} />

        <div className="surface-strong h-fit p-5 md:p-6">
          {canWrite && (
            <>
              <div className="text-base font-semibold text-white mb-3">تسجيل نشاط</div>
              <form onSubmit={logActivity} className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(ACTIVITY_LABELS_AR) as ActivityType[]).map((t) => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setActType(t)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-md border px-4 text-sm font-medium ring-focus',
                        actType === t
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-white'
                          : 'border-white/20 bg-white/[0.06] text-ink-200 hover:text-white hover:bg-white/[0.12]',
                      )}
                    >
                      {t === 'WHATSAPP' && <MessageSquare className="h-4 w-4" />}
                      {t === 'PHONE_CALL' && <Phone className="h-4 w-4" />}
                      {ACTIVITY_LABELS_AR[t]}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="form-label">النتيجة</span>
                    <input
                      value={actOutcome}
                      onChange={(e) => setActOutcome(e.target.value)}
                      placeholder="رد / لم يرد / تم الشرح …"
                    />
                  </label>
                  <label className="block">
                    <span className="form-label">ملاحظة</span>
                    <input
                      value={actNote}
                      onChange={(e) => setActNote(e.target.value)}
                      placeholder="تفاصيل إضافية"
                    />
                  </label>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-5 text-sm font-semibold hover:bg-ink-200 disabled:opacity-60 ring-focus"
                  >
                    {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    تسجيل
                  </button>
                </div>
              </form>
            </>
          )}

          {/* The timeline is history, not a mutation — it stays for a viewer. */}
          <div className={canWrite ? 'mt-6' : ''}>
            <div className="text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2.5">الجدول الزمني</div>
            <ul className="space-y-2.5">
              {(lead.activities ?? []).map((a) => (
                <li key={a.id} className="rounded-md border border-white/[0.18] bg-ink-760 p-3.5">
                  <div className="flex items-center justify-between gap-2 text-sm text-ink-300">
                    <span>{ACTIVITY_LABELS_AR[a.type]}</span>
                    <span className="ltr-inline">{new Date(a.occurredAt).toLocaleString('en-GB', { hour12: true })}</span>
                  </div>
                  {a.outcome && <div className="text-base text-white mt-1">{a.outcome}</div>}
                  {a.note && <div className="text-base text-ink-200 mt-1 whitespace-pre-wrap">{a.note}</div>}
                  {a.actorName && <div className="text-sm text-ink-300 mt-1">{a.actorName}</div>}
                </li>
              ))}
              {(!lead.activities || lead.activities.length === 0) && (
                <li className="text-base text-ink-300 text-center py-6">لا يوجد نشاط بعد</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <aside className="space-y-5">
        {/* Both pickers are pure mutation surfaces — the current stage and type
            are already on the card above, so a viewer loses nothing. */}
        {canWrite && (
          <div className="surface-strong h-fit p-4 md:p-5">
            <div className="text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2.5">تغيير المرحلة</div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STAGES.map((s) => (
                <button
                  key={s}
                  onClick={() => changeStage(s)}
                  disabled={pending || s === lead.stage}
                  className={cn(
                    'inline-flex items-center justify-between gap-1 rounded-md border px-3 text-sm font-medium ring-focus',
                    s === lead.stage
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/20 bg-white/[0.06] text-ink-200 hover:text-white hover:bg-white/[0.12]',
                  )}
                >
                  <span>{STAGE_LABELS_AR[s]}</span>
                  {s === lead.stage && <ArrowRight className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {canWrite && (
          <div className="surface-strong h-fit p-4 md:p-5">
            <div className="text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2.5">نوع العميل (قمع المبيعات)</div>
            <div className="grid grid-cols-1 gap-2">
              {CLIENT_TYPE_ORDER.map((t) => (
                <button
                  key={t}
                  onClick={() => changeClientType(t)}
                  disabled={pending || t === lead.clientType}
                  className={cn(
                    'inline-flex items-center justify-between gap-1 rounded-md border px-3 text-sm font-medium ring-focus',
                    t === lead.clientType
                      ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                      : 'border-white/20 bg-white/[0.06] text-ink-200 hover:text-white hover:bg-white/[0.12]',
                  )}
                >
                  <span>{CLIENT_TYPE_LABELS_AR[t]}</span>
                  {t === lead.clientType && <ArrowRight className="h-4 w-4 shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {lead.booking && (
          <div className="surface h-fit p-4 md:p-5">
            <div className="text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2">اجتماع مسجل</div>
            <div className="text-base text-white ltr-inline">
              {new Date(lead.booking.scheduledAt).toLocaleString('en-GB', { hour12: true })}
            </div>
            <div className="text-sm text-ink-300 mt-1">
              {lead.booking.calendarType} · {lead.booking.status}
            </div>
          </div>
        )}

        <div className="surface h-fit p-4 md:p-5">
          <div className="text-sm font-semibold uppercase tracking-wider text-ink-300 mb-2.5">سجل الأحداث</div>
          <ul className="space-y-2.5 text-sm">
            {(lead.events ?? []).slice().reverse().slice(0, 15).map((ev) => (
              <li key={ev.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-ink-100">{ev.type}</div>
                  {ev.detail && <div className="text-ink-300">{ev.detail}</div>}
                  {ev.actorName && <div className="text-ink-300">{ev.actorName}</div>}
                </div>
                <span className="text-ink-300 ltr-inline shrink-0">
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
    <div className="min-w-0">
      <div className="text-sm font-medium text-ink-300">{label}</div>
      <div className={cn('text-white break-words', ltr && 'ltr-inline')}>{fmt(value)}</div>
    </div>
  );
}
