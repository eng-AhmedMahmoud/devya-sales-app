'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead, LeadStage } from '@/lib/types';
import { STAGE_LABELS_AR, CLIENT_TYPE_LABELS_AR, OPEN_STAGES, api, errorMessageAr } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useDialog } from '@/components/ui/dialog-provider';

const STAGE_COLOR: Record<LeadStage, string> = {
  NEW: 'border-sales-new',
  CONTACTED: 'border-sales-contacted',
  QUALIFIED: 'border-sales-qualified',
  MEETING_SCHEDULED: 'border-sales-meeting',
  MEETING_DONE: 'border-sales-meeting',
  PROPOSAL_SENT: 'border-sales-proposal',
  NEGOTIATION: 'border-sales-negotiation',
  WON: 'border-sales-won',
  LOST: 'border-sales-lost',
  GHOSTED: 'border-sales-lost',
};

/**
 * A visibility grant is sight only (spec §2.2), and the board can now show
 * leads a rep may read but not move — so a card is draggable exactly when its
 * owner is the viewer (or the viewer is a manager). Without the check the
 * optimistic move would paint, the API would answer 403, and the card would
 * snap back with an English message in an Arabic dialog.
 */
export function PipelineBoard({
  leads: initial,
  viewerId,
  isManager,
}: {
  leads: Lead[];
  viewerId: string;
  isManager: boolean;
}) {
  const [leads, setLeads] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [_, start] = useTransition();
  const router = useRouter();
  const dialog = useDialog();

  const canMove = (lead: Lead) => isManager || lead.assignedRepId === viewerId;

  const grouped = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    for (const stage of OPEN_STAGES) map.set(stage, []);
    for (const l of leads) {
      if (!map.has(l.stage)) map.set(l.stage, []);
      map.get(l.stage)!.push(l);
    }
    return map;
  }, [leads]);

  async function moveTo(leadId: string, stage: LeadStage) {
    const current = leads.find((l) => l.id === leadId);
    if (!current || current.stage === stage) return;
    if (!canMove(current)) {
      dialog.notify({
        title: 'الاطلاع فقط',
        message: `هذا العميل مسند إلى ${current.assignedRepName ?? 'مندوب آخر'}، ولا يمكنك تغيير مرحلته.`,
        tone: 'warn',
      });
      return;
    }
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, stage } : l)));
    try {
      await api.leads.moveStage(leadId, stage);
      start(() => router.refresh());
    } catch (err) {
      setLeads(prev);
      dialog.notify({ title: 'فشل نقل العميل', message: errorMessageAr(err), tone: 'danger' });
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
      {OPEN_STAGES.map((stage) => {
        const items = grouped.get(stage) ?? [];
        return (
          <div
            key={stage}
            className="w-72 shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData('text/plain');
              if (id) moveTo(id, stage);
            }}
          >
            <div className={cn('surface border-t-4 rounded-t-lg p-3.5', STAGE_COLOR[stage])}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-base font-semibold text-white">{STAGE_LABELS_AR[stage]}</div>
                <span className="text-sm font-medium text-ink-200 ltr-inline">{items.length}</span>
              </div>
            </div>
            <div className="surface-strong border-t-0 rounded-b-lg p-2.5 min-h-[400px] space-y-2.5">
              {items.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  draggable={canMove(lead)}
                  onDragStart={(e) => {
                    if (!canMove(lead)) {
                      e.preventDefault();
                      return;
                    }
                    setDragging(lead.id);
                    e.dataTransfer.setData('text/plain', lead.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    'block rounded-md border border-white/[0.18] bg-ink-760 p-3.5 hover:border-white/35 hover:bg-ink-700 active:border-emerald-400/60 transition-colors ring-focus',
                    dragging === lead.id && 'opacity-40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-base font-semibold text-white truncate">{lead.clientName}</div>
                    <span className="chip ltr-inline shrink-0">{lead.code}</span>
                  </div>
                  {lead.companyName && (
                    <div className="text-sm text-ink-300 mt-1 truncate">{lead.companyName}</div>
                  )}
                  <div className="mt-2">
                    <span className="chip">{CLIENT_TYPE_LABELS_AR[lead.clientType]}</span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2 text-sm text-ink-300">
                    <span className="ltr-inline truncate">{lead.assignedRepName ?? '—'}</span>
                    {lead.expectedValueSar != null && (
                      <span className="ltr-inline font-medium text-emerald-300 shrink-0">
                        {lead.expectedValueSar.toLocaleString('en-US')} SAR
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {items.length === 0 && (
                <div className="text-center text-sm text-ink-300 py-8">لا توجد عملاء</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
