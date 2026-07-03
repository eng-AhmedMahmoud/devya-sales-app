'use client';

import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function normalizePhone(raw: string): string {
  // Strip whitespace, dashes, parentheses
  let p = raw.replace(/[\s\-().]/g, '');

  if (p.startsWith('+')) {
    // already E.164 with +
    return p.replace(/^\+/, '');
  }
  if (p.startsWith('00')) {
    return p.slice(2);
  }
  if (p.startsWith('0')) {
    // Egypt assumption
    return '20' + p.slice(1);
  }
  // Saudi heuristic: starts with 5 and 9 digits
  if (p.startsWith('5') && p.length === 9) {
    return '966' + p;
  }
  return p;
}

interface Props {
  phone: string | null | undefined;
  clientName: string;
  repName: string;
  className?: string;
  iconOnly?: boolean;
}

export function WhatsAppButton({ phone, clientName, repName, className, iconOnly }: Props) {
  if (!phone) return null;

  const e164 = normalizePhone(phone);
  const template = `مرحباً ${clientName}، معك ${repName} من ديڤيا. بخصوص مشروعكم — هل الوقت مناسب للحديث؟`;
  const href = `https://wa.me/${e164}?text=${encodeURIComponent(template)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="فتح واتساب"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/20 transition-colors',
        className,
      )}
    >
      <MessageCircle className="h-3.5 w-3.5" />
      {!iconOnly && 'واتساب'}
    </a>
  );
}
