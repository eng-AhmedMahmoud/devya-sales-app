'use client';

import { useState, useTransition } from 'react';
import { ChevronDown, Loader2, Trash2, UserCheck, MoveRight, Users, X, ChevronRight } from 'lucide-react';
import { api, ApiError, CLIENT_TYPE_LABELS_AR, CLIENT_TYPE_ORDER, STAGE_LABELS_AR } from '@/lib/api';
import type { AuthUser, ClientType, LeadStage, TeamMember } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';
import { cn } from '@/lib/utils';

const ALL_STAGES: LeadStage[] = [
  'NEW', 'CONTACTED', 'QUALIFIED', 'MEETING_SCHEDULED',
  'MEETING_DONE', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST', 'GHOSTED',
];

function isManager(user: AuthUser) {
  return ['SALES_MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role);
}

interface BulkResult {
  ok: number;
  failed: { id: string; reason: string }[];
}

interface Props {
  selectedIds: string[];
  totalOnPage: number;
  allPageSelected: boolean;
  onSelectAllPage: () => void;
  onClearSelection: () => void;
  onRefresh: () => void;
  user: AuthUser;
  team: TeamMember[];
}

export function BulkToolbar({
  selectedIds,
  totalOnPage,
  allPageSelected,
  onSelectAllPage,
  onClearSelection,
  onRefresh,
  user,
  team,
}: Props) {
  const dialog = useDialog();
  const [pending, start] = useTransition();
  const [stageOpen, setStageOpen] = useState(false);
  const [clientTypeOpen, setClientTypeOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [showFailures, setShowFailures] = useState(false);

  const manager = isManager(user);

  async function runBulk(
    action: 'delete' | 'setStage' | 'setClientType' | 'assign',
    payload?: { stage?: LeadStage; clientType?: ClientType; repId?: string },
  ) {
    start(async () => {
      try {
        const res = await api.leads.bulk({ ids: selectedIds, action, payload });
        setResult(res);
        setShowFailures(false);
        onRefresh();
        if (res.failed.length === 0) {
          onClearSelection();
        }
      } catch (err) {
        dialog.notify({
          title: 'فشل تنفيذ العملية',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  async function handleDelete() {
    setStageOpen(false);
    setClientTypeOpen(false);
    setAssignOpen(false);
    const ok = await dialog.confirm({
      title: `حذف ${selectedIds.length} سجل؟`,
      message: 'هذا الإجراء لا يمكن التراجع عنه.',
      confirmLabel: 'حذف',
      cancelLabel: 'إلغاء',
      tone: 'danger',
    });
    if (!ok) return;
    await runBulk('delete');
  }

  function handleSetStage(stage: LeadStage) {
    setStageOpen(false);
    runBulk('setStage', { stage });
  }

  function handleSetClientType(clientType: ClientType) {
    setClientTypeOpen(false);
    runBulk('setClientType', { clientType });
  }

  function handleAssign(repId: string) {
    setAssignOpen(false);
    runBulk('assign', { repId });
  }

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mx-auto max-w-3xl">
      <div className="surface-strong border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl">
        {/* Count + select-all/clear */}
        <div className="flex items-center gap-2 text-sm text-ink-200">
          <span className="font-medium text-white">{selectedIds.length}</span>
          <span>محدد</span>
          {!allPageSelected && (
            <button
              onClick={onSelectAllPage}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              تحديد الصفحة كلها ({totalOnPage})
            </button>
          )}
          <button
            onClick={onClearSelection}
            className="text-xs text-ink-400 hover:text-ink-200 inline-flex items-center gap-0.5"
          >
            <X className="h-3 w-3" /> إلغاء
          </button>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap relative">
          {/* نقل مرحلة */}
          <div className="relative">
            <button
              onClick={() => { setStageOpen((p) => !p); setClientTypeOpen(false); setAssignOpen(false); }}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-ink-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <MoveRight className="h-3.5 w-3.5" />
              نقل مرحلة
              <ChevronDown className="h-3 w-3" />
            </button>
            {stageOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-48 rounded-lg border border-white/10 bg-ink-800 shadow-xl z-50 py-1 overflow-hidden">
                {ALL_STAGES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSetStage(s)}
                    className="w-full text-start px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] hover:text-white"
                  >
                    {STAGE_LABELS_AR[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* نوع العميل */}
          <div className="relative">
            <button
              onClick={() => { setClientTypeOpen((p) => !p); setStageOpen(false); setAssignOpen(false); }}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-ink-200 hover:bg-white/[0.08] disabled:opacity-50"
            >
              <Users className="h-3.5 w-3.5" />
              نوع العميل
              <ChevronDown className="h-3 w-3" />
            </button>
            {clientTypeOpen && (
              <div className="absolute bottom-full mb-2 right-0 w-52 rounded-lg border border-white/10 bg-ink-800 shadow-xl z-50 py-1 overflow-hidden">
                {CLIENT_TYPE_ORDER.map((t) => (
                  <button
                    key={t}
                    onClick={() => handleSetClientType(t)}
                    className="w-full text-start px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] hover:text-white"
                  >
                    {CLIENT_TYPE_LABELS_AR[t]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* إسناد (managers only) */}
          {manager && (
            <div className="relative">
              <button
                onClick={() => { setAssignOpen((p) => !p); setStageOpen(false); setClientTypeOpen(false); }}
                disabled={pending}
                className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-ink-200 hover:bg-white/[0.08] disabled:opacity-50"
              >
                <UserCheck className="h-3.5 w-3.5" />
                إسناد
                <ChevronDown className="h-3 w-3" />
              </button>
              {assignOpen && (
                <div className="absolute bottom-full mb-2 right-0 w-52 rounded-lg border border-white/10 bg-ink-800 shadow-xl z-50 py-1 overflow-hidden">
                  {team.filter((m) => ['SALES_REP', 'SALES_MANAGER'].includes(m.role)).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleAssign(m.id)}
                      className="w-full text-start px-3 py-2 text-sm text-ink-200 hover:bg-white/[0.06] hover:text-white"
                    >
                      {m.name ?? m.email}
                    </button>
                  ))}
                  {team.filter((m) => ['SALES_REP', 'SALES_MANAGER'].includes(m.role)).length === 0 && (
                    <div className="px-3 py-2 text-sm text-ink-500">لا يوجد مندوبون</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* حذف (managers only) */}
          {manager && (
            <button
              onClick={handleDelete}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              حذف
            </button>
          )}
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={cn(
          'mt-2 rounded-lg border px-4 py-2.5 text-sm',
          result.failed.length === 0
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
            : 'border-amber-500/20 bg-amber-500/10 text-amber-200',
        )}>
          <div className="flex items-center justify-between gap-2">
            <span>
              <span className="font-medium">{result.ok}</span> نجحت
              {result.failed.length > 0 && (
                <> · <span className="font-medium">{result.failed.length}</span> تم تخطيها</>
              )}
            </span>
            <div className="flex items-center gap-2">
              {result.failed.length > 0 && (
                <button
                  onClick={() => setShowFailures((p) => !p)}
                  className="inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:no-underline"
                >
                  <ChevronRight className={cn('h-3 w-3 transition-transform', showFailures && 'rotate-90')} />
                  التفاصيل
                </button>
              )}
              <button onClick={() => setResult(null)} className="text-ink-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          {showFailures && result.failed.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-ink-300">
              {result.failed.map((f) => (
                <li key={f.id} className="ltr-inline">
                  {f.id}: {f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
