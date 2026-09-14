'use client';

import { useState, useTransition } from 'react';
import { Check, ListTodo, Loader2, Plus } from 'lucide-react';
import { api, errorMessageAr } from '@/lib/api';
import type { LeadNextAction } from '@/lib/types';
import { useDialog } from '@/components/ui/dialog-provider';
import { cn } from '@/lib/utils';

/**
 * "Next action" reminders pinned to a single lead. A toggle button reveals a
 * textarea + save; each saved item lists newest-first with its own "Done"
 * control that HARD-DELETES the row (confirmed first — there is no undo).
 * Scoped entirely to `leadId`, so items never bleed between clients.
 *
 * Without `canWrite` — a rep reading someone else's lead through a visibility
 * grant — the reminders still list, but nothing may be added or closed.
 */
export function NextActionsBlock({
  leadId,
  initial,
  canWrite,
}: {
  leadId: string;
  initial: LeadNextAction[];
  canWrite: boolean;
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
          message: errorMessageAr(err),
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
        message: errorMessageAr(err),
        tone: 'danger',
      });
    }
  }

  return (
    <div className="surface-strong h-fit p-5 md:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-base font-semibold text-white">الخطوات التالية</div>
        {canWrite && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors ring-focus',
              open
                ? 'border-white/30 bg-white/[0.12] text-white'
                : 'border-emerald-400/45 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25',
            )}
          >
            <ListTodo className="h-4 w-4" />
            ما الخطوة التالية معه؟
          </button>
        )}
      </div>

      {canWrite && open && (
        <form onSubmit={submit} className="space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            autoFocus
            placeholder="اكتب الخطوة التالية مع هذا العميل…"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-white text-ink-900 px-5 text-sm font-semibold hover:bg-ink-200 disabled:opacity-50 disabled:cursor-not-allowed ring-focus"
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              حفظ
            </button>
          </div>
        </form>
      )}

      <ul className="space-y-2.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-start justify-between gap-3 rounded-md border border-white/[0.18] bg-ink-760 p-3.5"
          >
            <div className="min-w-0 flex-1">
              <div className="text-base text-ink-100 whitespace-pre-wrap break-words">{item.text}</div>
              <div className="mt-1 text-sm text-ink-300 ltr-inline">
                {new Date(item.createdAt).toLocaleString('en-GB', { hour12: true })}
                {item.createdByName ? ` · ${item.createdByName}` : ''}
              </div>
            </div>
            {canWrite && (
              <button
                type="button"
                onClick={() => markDone(item)}
                title="تم — حذف نهائي"
                className="inline-flex shrink-0 items-center gap-2 rounded-md border border-emerald-400/45 bg-emerald-500/15 px-4 text-sm font-medium text-emerald-200 hover:bg-emerald-500/25 ring-focus"
              >
                <Check className="h-4 w-4" />
                تم
              </button>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-base text-ink-300 text-center py-5">لا توجد خطوات تالية</li>
        )}
      </ul>
    </div>
  );
}
