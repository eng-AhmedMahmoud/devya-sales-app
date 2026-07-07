'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Lead, LeadStage } from '@/lib/types';
import { STAGE_LABELS_AR, CLIENT_TYPE_LABELS_AR, OPEN_STAGES, api } from '@/lib/api';
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

export function PipelineBoard({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [_, start] = useTransition();
  const router = useRouter();
  const dialog = useDialog();

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
    const prev = leads;
    setLeads((ls) => ls.map((l) => (l.id === leadId ? { ...l, stage } : l)));
    try {
      await api.leads.moveStage(leadId, stage);
      start(() => router.refresh());
    } catch (err) {
      setLeads(prev);
      dialog.notify({ title: 'فشل نقل العميل', message: (err as Error).message, tone: 'danger' });
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
            <div className={cn('surface border-t-4 rounded-t-lg p-3', STAGE_COLOR[stage])}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-white">{STAGE_LABELS_AR[stage]}</div>
                <span className="text-xs text-ink-400">{items.length}</span>
              </div>
            </div>
            <div className="surface-strong border-t-0 rounded-b-lg p-2 min-h-[400px] space-y-2">
              {items.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  draggable
                  onDragStart={(e) => {
                    setDragging(lead.id);
                    e.dataTransfer.setData('text/plain', lead.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    'block rounded-md border border-white/10 bg-white/[0.02] p-3 hover:border-white/25 hover:bg-white/[0.04] transition-colors',
                    dragging === lead.id && 'opacity-40',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium text-white truncate">{lead.clientName}</div>
                    <span className="chip ltr-inline">{lead.code}</span>
                  </div>
                  {lead.companyName && (
                    <div className="text-xs text-ink-400 mt-0.5 truncate">{lead.companyName}</div>
                  )}
                  <div className="mt-1.5">
                    <span className="chip text-[10px]">{CLIENT_TYPE_LABELS_AR[lead.clientType]}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-400">
                    <span className="ltr-inline">{lead.assignedRepName ?? '—'}</span>
                    {lead.expectedValueSar != null && (
                      <span className="ltr-inline text-emerald-300">
                        {lead.expectedValueSar.toLocaleString('en-US')} SAR
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {items.length === 0 && (
                <div className="text-center text-xs text-ink-500 py-8">لا توجد عملاء</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
