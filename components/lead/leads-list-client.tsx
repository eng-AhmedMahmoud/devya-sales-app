'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { BUDGET_LABELS_AR, CLIENT_TYPE_LABELS_AR, SOURCE_LABELS_AR, STAGE_LABELS_AR } from '@/lib/api';
import type { AuthUser, Lead, TeamMember } from '@/lib/types';
import { BulkToolbar } from '@/components/lead/bulk-toolbar';
import { WhatsAppButton } from '@/components/lead/whatsapp-button';
import { cn } from '@/lib/utils';

interface Props {
  leads: Lead[];
  user: AuthUser;
  team: TeamMember[];
}

export function LeadsListClient({ leads, user, team }: Props) {
  const router = useRouter();
  const onRefresh = useCallback(() => router.refresh(), [router]);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const lastClickedIdx = useRef<number | null>(null);

  // Exit bulk mode on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setBulkMode(false);
        setSelected(new Set());
        lastClickedIdx.current = null;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toggleBulkMode() {
    setBulkMode((p) => !p);
    setSelected(new Set());
    lastClickedIdx.current = null;
  }

  function toggleOne(id: string, idx: number, shiftHeld: boolean) {
    const next = new Set(selected);
    if (shiftHeld && lastClickedIdx.current !== null) {
      const from = Math.min(lastClickedIdx.current, idx);
      const to = Math.max(lastClickedIdx.current, idx);
      const adding = !selected.has(id);
      for (let i = from; i <= to; i++) {
        if (adding) next.add(leads[i].id);
        else next.delete(leads[i].id);
      }
    } else {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    lastClickedIdx.current = idx;
    setSelected(next);
  }

  const allPageSelected = leads.length > 0 && leads.every((l) => selected.has(l.id));

  const selectAllPage = useCallback(() => {
    setSelected(new Set(leads.map((l) => l.id)));
  }, [leads]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  const repName = user.name ?? 'فريق ديڤيا';
  const colCount = bulkMode ? 10 : 9;

  return (
    <>
      <div className="surface-strong overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-400 border-b border-white/5">
            <tr>
              {bulkMode && (
                <th className="px-3 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={allPageSelected ? clearSelection : selectAllPage}
                    className="accent-emerald-500 cursor-pointer"
                    title="تحديد الكل"
                  />
                </th>
              )}
              <th className="text-start px-4 py-3">الكود</th>
              <th className="text-start px-4 py-3">العميل</th>
              <th className="text-start px-4 py-3">الشركة</th>
              <th className="text-start px-4 py-3">الهاتف</th>
              <th className="text-start px-4 py-3">المصدر</th>
              <th className="text-start px-4 py-3">الميزانية</th>
              <th className="text-start px-4 py-3">المرحلة</th>
              <th className="text-start px-4 py-3">نوع العميل</th>
              <th className="text-start px-4 py-3">المندوب</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l, idx) => {
              const isSelected = selected.has(l.id);
              return (
                <tr
                  key={l.id}
                  className={cn(
                    'border-b border-white/[0.04] hover:bg-white/[0.02]',
                    isSelected && 'bg-emerald-500/[0.06]',
                  )}
                >
                  {bulkMode && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {/* controlled by onClick */}}
                        onClick={(e) => { e.stopPropagation(); toggleOne(l.id, idx, e.shiftKey); }}
                        className="accent-emerald-500 cursor-pointer"
                      />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.id}`} className="ltr-inline text-emerald-300 hover:text-white">
                      {l.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white">{l.clientName}</td>
                  <td className="px-4 py-3 text-ink-300">{l.companyName ?? '—'}</td>
                  <td className="px-4 py-3 text-ink-300 ltr-inline">
                    <div className="flex items-center gap-1.5">
                      <span>{l.phone ?? '—'}</span>
                      {l.phone && (
                        <WhatsAppButton
                          phone={l.phone}
                          clientName={l.clientName}
                          repName={repName}
                          iconOnly
                          className="py-0.5 px-1.5"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{SOURCE_LABELS_AR[l.source]}</td>
                  <td className="px-4 py-3 text-ink-300">{BUDGET_LABELS_AR[l.budget]}</td>
                  <td className="px-4 py-3 text-ink-300">{STAGE_LABELS_AR[l.stage]}</td>
                  <td className="px-4 py-3 text-ink-300">{CLIENT_TYPE_LABELS_AR[l.clientType]}</td>
                  <td className="px-4 py-3 text-ink-300">{l.assignedRepName ?? '—'}</td>
                </tr>
              );
            })}
            {leads.length === 0 && (
              <tr>
                <td colSpan={colCount} className="text-center text-ink-500 py-10">
                  لا توجد نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Bulk toolbar */}
      {bulkMode && (
        <BulkToolbar
          selectedIds={Array.from(selected)}
          totalOnPage={leads.length}
          allPageSelected={allPageSelected}
          onSelectAllPage={selectAllPage}
          onClearSelection={clearSelection}
          onRefresh={onRefresh}
          user={user}
          team={team}
        />
      )}

      {/* Bulk toggle button (floating bottom-right) */}
      <button
        onClick={toggleBulkMode}
        title={bulkMode ? 'إلغاء وضع الدفعة' : 'وضع الدفعة'}
        className={cn(
          'fixed bottom-6 left-6 z-20 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-lg transition-colors',
          bulkMode
            ? 'bg-emerald-500 text-ink-900 hover:bg-emerald-400'
            : 'bg-ink-700 border border-white/10 text-ink-200 hover:bg-ink-600',
        )}
      >
        <Layers className="h-4 w-4" />
        {bulkMode ? 'إلغاء الدفعة' : 'دفعة'}
      </button>
    </>
  );
}
