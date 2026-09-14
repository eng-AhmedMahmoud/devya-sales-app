'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, X } from 'lucide-react';

type Tone = 'default' | 'danger' | 'warn' | 'success' | 'info';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
}
interface NotifyOptions { title: string; message?: string; tone?: Tone }

interface DialogContextValue {
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
  notify: (opts: NotifyOptions) => Promise<void>;
}
const DialogContext = createContext<DialogContextValue | null>(null);

interface OpenState {
  kind: 'confirm' | 'notify';
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: Tone;
  resolve: (v: boolean) => void;
}

const TONE_BADGE: Record<Tone, { icon: typeof Info; color: string; bg: string; border: string }> = {
  default: { icon: Info, color: '#D4D4D4', bg: 'rgba(255,255,255,0.10)', border: 'rgba(255,255,255,0.22)' },
  info: { icon: Info, color: '#93C5FD', bg: 'rgba(96,165,250,0.16)', border: 'rgba(96,165,250,0.45)' },
  warn: { icon: AlertTriangle, color: '#FCD34D', bg: 'rgba(245,158,11,0.16)', border: 'rgba(245,158,11,0.45)' },
  danger: { icon: AlertTriangle, color: '#FCA5A5', bg: 'rgba(239,68,68,0.16)', border: 'rgba(239,68,68,0.45)' },
  success: { icon: CheckCircle2, color: '#34D399', bg: 'rgba(16,185,129,0.16)', border: 'rgba(16,185,129,0.45)' },
};
const TONE_BUTTON: Record<Tone, string> = {
  default: 'bg-white text-ink-900 hover:bg-ink-200',
  info: 'bg-blue-500 text-white hover:bg-blue-400',
  warn: 'bg-amber-500 text-ink-900 hover:bg-amber-400',
  danger: 'bg-rose-500 text-white hover:bg-rose-400',
  success: 'bg-emerald-500 text-ink-900 hover:bg-emerald-400',
};

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OpenState | null>(null);
  const close = useCallback((value: boolean) => {
    setState((s) => { if (s) s.resolve(value); return null });
  }, []);
  useEffect(() => {
    if (!state) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'Enter') close(true);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, close]);
  const value = useMemo<DialogContextValue>(
    () => ({
      confirm: (opts) =>
        new Promise<boolean>((resolve) =>
          setState({
            kind: 'confirm',
            title: opts.title,
            message: opts.message,
            confirmLabel: opts.confirmLabel ?? 'تأكيد',
            cancelLabel: opts.cancelLabel ?? 'إلغاء',
            tone: opts.tone ?? 'default',
            resolve,
          }),
        ),
      notify: (opts) =>
        new Promise<void>((resolve) =>
          setState({
            kind: 'notify',
            title: opts.title,
            message: opts.message,
            confirmLabel: 'حسناً',
            cancelLabel: '',
            tone: opts.tone ?? 'info',
            resolve: () => resolve(),
          }),
        ),
    }),
    [],
  );
  return (
    <DialogContext.Provider value={value}>
      {children}
      {state && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" role="dialog" aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) close(false); }}>
          <div className="absolute inset-0 bg-black/75" />
          <div className="relative w-full max-w-md rounded-xl border border-white/20 bg-ink-775 shadow-2xl">
            <button type="button" onClick={() => close(false)}
              className="tap-box absolute left-2 top-2 rounded-md text-ink-300 hover:bg-white/[0.10] hover:text-white ring-focus"
              aria-label="إغلاق">
              <X className="h-5 w-5" />
            </button>
            <div className="p-5 pt-6">
              <ToneIcon tone={state.tone} />
              <h3 className="mt-3 text-lg font-semibold text-white">{state.title}</h3>
              {state.message && <p className="mt-2 text-base text-ink-200 whitespace-pre-wrap">{state.message}</p>}
            </div>
            <div className="flex items-center justify-start gap-2 px-5 py-4 border-t border-white/10">
              {state.kind === 'confirm' && (
                <button type="button" onClick={() => close(false)}
                  className="inline-flex items-center rounded-md border border-white/20 bg-white/[0.06] px-4 text-sm font-medium text-ink-100 hover:bg-white/[0.12] ring-focus">
                  {state.cancelLabel}
                </button>
              )}
              <button type="button" onClick={() => close(true)} autoFocus
                className={`inline-flex items-center gap-2 rounded-md px-5 text-sm font-semibold ring-focus ${TONE_BUTTON[state.tone]}`}>
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

function ToneIcon({ tone }: { tone: Tone }) {
  const b = TONE_BADGE[tone];
  const Icon = b.icon;
  return (
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full"
      style={{ background: b.bg, border: `1px solid ${b.border}` }}>
      <Icon className="h-5 w-5" style={{ color: b.color }} />
    </div>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be inside <DialogProvider>');
  return ctx;
}

export function Spinner() {
  return <Loader2 className="h-4 w-4 animate-spin" />;
}
