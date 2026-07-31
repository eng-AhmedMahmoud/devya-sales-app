'use client';

import { useState, useTransition } from 'react';
import { Check, ListTodo, Loader2, Plus } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import type { LeadNextAction } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';
import { cn } from '@/lib/utils';

/**
 * "Next action" reminders pinned to a single lead. A toggle button reveals a
 * textarea + save; each saved item lists newest-first with its own "Done"
 * control that HARD-DELETES the row (confirmed first — there is no undo).
 * Scoped entirely to `leadId`, so items never bleed between clients.
 */
export function NextActionsBlock({
  leadId,
  initial,
}: {
  leadId: string;
  initial: LeadNextAction[];
}) {
  const dialog = useDialog();
  const [items, setItems] = useState<LeadNextAction[]>(initial);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    start(async () => {
      try {
        const created = await api.nextActions.create(leadId, trimmed);
        setItems((prev) => [created, ...prev]);
        setText('');
        setOpen(false);
      } catch (err) {
        dialog.notify({
          title: 'تعذّر الحفظ',
          message: err instanceof ApiError ? err.message : (err as Error).message,
          tone: 'danger',
        });
      }
    });
  }

  async function markDone(item: LeadNextAction) {
    const confirmed = await dialog.confirm({
      title: 'إنهاء هذه الخطوة؟',
      message: 'سيتم حذفها نهائيًا ولا يمكن التراجع.',
      confirmLabel: 'إنهاء وحذف',
      tone: 'danger',
    });
    if (!confirmed) return;
    // optimistic removal
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== item.id));
    try {
      await api.nextActions.remove(leadId, item.id);
    } catch (err) {
      setItems(prev); // rollback on failure
      dialog.notify({
        title: 'تعذّر الحذف',
        message: err instanceof ApiError ? err.message : (err as Error).message,
        tone: 'danger',
      });
    }
  }

  return (
    <div className="surface-strong p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-white">الخطوات التالية</div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors',
            open
              ? 'border-white/25 bg-white/[0.08] text-white'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20',
          )}
        >
          <ListTodo className="h-3.5 w-3.5" />
          ما الخطوة التالية معه؟
        </button>
      </div>

      {open && (
        <form onSubmit={submit} className="space-y-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="اكتب الخطوة التالية مع هذا العميل…"
            className="w-full resize-y rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-100 focus:outline-none focus:border-white/25 focus:ring-2 focus:ring-white/10"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-4 py-2 text-sm font-medium hover:bg-ink-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              حفظ
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-md border border-white/[0.06] bg-white/[0.015] p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm text-ink-100 whitespace-pre-wrap break-words">{item.text}</div>
              <div className="mt-1 text-[11px] text-ink-500 ltr-inline">
                {new Date(item.createdAt).toLocaleString('en-GB', { hour12: true })}
                {item.createdByName ? ` · ${item.createdByName}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={() => markDone(item)}
              title="تم — حذف نهائي"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20"
            >
              <Check className="h-3.5 w-3.5" />
              تم
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-ink-500 text-center py-5">لا توجد خطوات تالية</li>
        )}
      </ul>
    </div>
  );
}
