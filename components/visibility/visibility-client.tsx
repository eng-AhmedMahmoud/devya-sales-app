'use client';

import { useEffect, useState, useTransition } from 'react';
import { Eye, Loader2, Plus, ShieldCheck, X } from 'lucide-react';
import { api, ApiError, ROLE_LABELS_AR } from '@/lib/api';
import type { RepVisibilityGrant, RepVisibilityOverview, RepVisibilityRow } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';

// This screen administers the sales pipeline only; outdoor grants live in the
// outdoor app, on its own permissions page.
const SCOPE = 'SALES' as const;

// The backend speaks English in its 4xx bodies — translate the ones a manager
// can actually trigger, and fall back to the raw text for anything unexpected.
const ERROR_LABELS_AR: Record<string, string> = {
  'Unknown grantee': 'المندوب المستفيد غير معروف.',
  'Managers already see every rep': 'المديرون يرون جميع العملاء بحكم أدوارهم.',
  'A rep already sees their own clients': 'المندوب يرى عملاءه بالفعل.',
  'Unknown target rep': 'المندوب المستهدف غير معروف.',
  'That grant already exists': 'هذه الصلاحية ممنوحة بالفعل.',
  'Grant not found': 'الصلاحية غير موجودة.',
  'Grant is already revoked': 'تم إلغاء هذه الصلاحية من قبل.',
};

function errorAr(err: unknown): string {
  const raw = err instanceof ApiError ? err.message : (err as Error).message;
  return ERROR_LABELS_AR[raw] ?? raw;
}

function repName(row: RepVisibilityRow) {
  return row.rep.name ?? row.rep.email;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB');
}

export function VisibilityClient({ overview }: { overview: RepVisibilityOverview }) {
  const [rows, setRows] = useState(overview.reps);
  const [grantFor, setGrantFor] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dialog = useDialog();

  async function reload() {
    const next = await api.visibility.reps(SCOPE);
    setRows(next.reps);
  }

  async function revoke(row: RepVisibilityRow, grant: RepVisibilityGrant) {
    const target = grant.targetRepName ?? 'كل المندوبين';
    const ok = await dialog.confirm({
      title: 'إلغاء صلاحية الرؤية',
      message: `لن يتمكن ${repName(row)} من رؤية عملاء ${target} بعد الآن.`,
      confirmLabel: 'إلغاء الصلاحية',
      cancelLabel: 'تراجع',
      tone: 'danger',
    });
    if (!ok) return;
    setRevokingId(grant.id);
    start(async () => {
      try {
        await api.visibility.revoke(grant.id);
        await reload();
      } catch (err) {
        dialog.notify({ title: 'تعذر إلغاء الصلاحية', message: errorAr(err), tone: 'danger' });
      } finally {
        setRevokingId(null);
      }
    });
  }

  const grantees = rows.filter((row) => !row.isManager);

  return (
    <div className="space-y-5">
      <section className="surface h-fit p-5 md:p-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Eye className="h-5 w-5 shrink-0 text-emerald-300 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-base text-ink-100">
              يرى كل مندوب عملاءه فقط بشكل افتراضي. امنح رؤية إضافية هنا عند الحاجة.
            </p>
            <p className="text-sm text-ink-300">
              الصلاحية للاطّلاع فقط: المندوب المستفيد يرى بيانات زميله دون حق التعديل أو إعادة
              الإسناد أو الحذف، ولا تمنحه أي صلاحيات إشرافية.
            </p>
          </div>
        </div>
        {grantees.length > 0 && (
          <button
            type="button"
            onClick={() => setGrantFor('')}
            className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-5 text-sm font-semibold hover:bg-ink-200 ring-focus"
          >
            <Plus className="h-5 w-5" />
            منح رؤية
          </button>
        )}
      </section>

      {rows.length === 0 ? (
        <section className="surface-strong h-fit p-8 text-center text-ink-300">
          لا يوجد مندوبون نشطون في فريق المبيعات.
        </section>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {rows.map((row) => (
            <RepCard
              key={row.rep.id}
              row={row}
              busy={pending}
              revokingId={revokingId}
              onGrant={() => setGrantFor(row.rep.id)}
              onRevoke={(grant) => revoke(row, grant)}
            />
          ))}
        </div>
      )}

      {/* '' opens the dialog with no rep preselected (header button). */}
      {grantFor !== null && (
        <GrantDialog
          rows={rows}
          grantees={grantees}
          initialGranteeId={grantFor}
          onClose={() => setGrantFor(null)}
          // Reload before closing: a failed refresh keeps the dialog up with the
          // error instead of dropping the manager on a stale board.
          onGranted={async () => {
            await reload();
            setGrantFor(null);
          }}
        />
      )}
    </div>
  );
}

function RepCard({
  row,
  busy,
  revokingId,
  onGrant,
  onRevoke,
}: {
  row: RepVisibilityRow;
  busy: boolean;
  revokingId: string | null;
  onGrant: () => void;
  onRevoke: (grant: RepVisibilityGrant) => void;
}) {
  return (
    <article className="surface-strong h-fit p-5 md:p-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-lg font-semibold text-white truncate">{repName(row)}</div>
          <div className="text-sm text-ink-300 truncate">
            <span className="ltr-inline">{row.rep.email}</span>
          </div>
        </div>
        <span className="chip shrink-0">{ROLE_LABELS_AR[row.rep.role]}</span>
      </div>

      {row.isManager ? (
        <p className="flex items-center gap-2 text-base text-ink-200">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" />
          يرى جميع العملاء بحكم دوره الإداري — لا حاجة لمنح صلاحيات.
        </p>
      ) : (
        <>
          <div>
            <div className="form-label">يرى الآن</div>
            {row.grants.length === 0 ? (
              <p className="text-base text-ink-300">عملاءه فقط — لا توجد صلاحيات إضافية.</p>
            ) : (
              <ul className="space-y-2">
                {row.grants.map((grant) => (
                  <li
                    key={grant.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-white/15 bg-white/[0.05] ps-3 pe-1"
                  >
                    <div className="min-w-0 py-2">
                      <div className="text-base text-white truncate">
                        {grant.targetRepName ?? 'كل المندوبين'}
                      </div>
                      {grant.note && (
                        <div className="text-sm text-ink-200 break-words">{grant.note}</div>
                      )}
                      <div className="text-sm text-ink-300">
                        منحها {grant.grantedByName ?? '—'} ·{' '}
                        <span className="ltr-inline">{formatDate(grant.createdAt)}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRevoke(grant)}
                      disabled={busy}
                      title="إلغاء الصلاحية"
                      aria-label="إلغاء الصلاحية"
                      className="tap-box shrink-0 rounded-md text-ink-300 hover:text-rose-300 hover:bg-white/[0.08] transition-colors disabled:opacity-60 ring-focus"
                    >
                      {revokingId === grant.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <X className="h-5 w-5" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {row.seesAll && (
              <p className="mt-2 text-sm text-emerald-300">
                يرى حالياً عملاء جميع المندوبين في فريق المبيعات.
              </p>
            )}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onGrant}
              className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/[0.06] px-4 text-sm font-medium text-ink-100 hover:bg-white/[0.12] hover:border-white/30 transition-colors ring-focus"
            >
              <Plus className="h-5 w-5" />
              منح رؤية
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function GrantDialog({
  rows,
  grantees,
  initialGranteeId,
  onClose,
  onGranted,
}: {
  rows: RepVisibilityRow[];
  grantees: RepVisibilityRow[];
  initialGranteeId: string;
  onClose: () => void;
  onGranted: () => Promise<void>;
}) {
  const [granteeId, setGranteeId] = useState(initialGranteeId);
  // '' = «كل المندوبين» → the backend's wildcard (targetRepId: null).
  const [targetRepId, setTargetRepId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!granteeId) {
      setError('اختر المندوب المستفيد.');
      return;
    }
    setError(null);
    start(async () => {
      try {
        await api.visibility.grant({
          scope: SCOPE,
          granteeId,
          targetRepId: targetRepId || null,
          note: note.trim() || undefined,
        });
        await onGranted();
      } catch (err) {
        setError(errorAr(err));
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="منح صلاحية رؤية"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/75" />
      <form
        onSubmit={submit}
        className="relative w-full max-w-lg rounded-xl border border-white/20 bg-ink-775 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="tap-box absolute left-2 top-2 rounded-md text-ink-300 hover:bg-white/[0.10] hover:text-white ring-focus"
          aria-label="إغلاق"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-5 pt-6 space-y-4">
          <h3 className="text-lg font-semibold text-white">منح صلاحية رؤية</h3>

          <label className="block">
            <span className="form-label">المندوب المستفيد</span>
            <select value={granteeId} onChange={(e) => setGranteeId(e.target.value)}>
              <option value="">— اختر —</option>
              {grantees.map((row) => (
                <option key={row.rep.id} value={row.rep.id}>{repName(row)}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="form-label">يرى عملاء</span>
            <select value={targetRepId} onChange={(e) => setTargetRepId(e.target.value)}>
              <option value="">كل المندوبين</option>
              {rows
                .filter((row) => row.rep.id !== granteeId)
                .map((row) => (
                  <option key={row.rep.id} value={row.rep.id}>{repName(row)}</option>
                ))}
            </select>
          </label>

          <label className="block">
            <span className="form-label">ملاحظة (اختيارية)</span>
            <input
              value={note}
              maxLength={400}
              onChange={(e) => setNote(e.target.value)}
              placeholder="سبب منح الرؤية"
            />
          </label>

          {error && <p className="text-base text-rose-300">{error}</p>}

          <p className="text-sm text-ink-300">
            الرؤية للاطّلاع فقط ويمكن إلغاؤها في أي وقت.
          </p>
        </div>

        <div className="flex items-center justify-start gap-2 px-5 py-4 border-t border-white/10">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-5 text-sm font-semibold hover:bg-ink-200 disabled:opacity-60 ring-focus"
          >
            {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
            منح الرؤية
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-md border border-white/20 bg-white/[0.06] px-4 text-sm font-medium text-ink-100 hover:bg-white/[0.12] ring-focus"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
