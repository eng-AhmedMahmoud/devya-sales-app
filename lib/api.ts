import { appConfig } from './config';
import type {
  ActivityType,
  AuthUser,
  BudgetBucket,
  FunnelBucket,
  Lead,
  LeadActivity,
  LeadSource,
  LeadStage,
  PipelineOutcome,
  RepLeaderboardEntry,
  SalesTarget,
  TeamMember,
} from './types';

export class ApiError extends Error {
  constructor(public status: number, public body: unknown, message: string) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit & { cookieHeader?: string }): Promise<T> {
  const { cookieHeader, ...rest } = init ?? {};
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (cookieHeader) headers['cookie'] = cookieHeader;

  const isServer = typeof window === 'undefined';
  const base = isServer
    ? process.env.API_PROXY_TARGET ?? 'https://api.devya-solutions.com'
    : appConfig.apiUrl;

  const res = await fetch(`${base}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    let body: unknown = null;
    try { body = await res.json(); } catch {}
    const message =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error?: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed with ${res.status}`;
    throw new ApiError(res.status, body, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface CreateLeadPayload {
  clientName: string;
  companyName?: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  industry?: string;
  targetAudience?: string;
  notes?: string;
  budget?: BudgetBucket;
  expectedValueSar?: number;
  source: LeadSource;
  campaignName?: string;
  stage?: LeadStage;
  assignedRepId?: string;
  assignedRepName?: string;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload>;

export interface ListLeadsParams {
  stage?: LeadStage;
  outcome?: PipelineOutcome;
  source?: LeadSource;
  budget?: BudgetBucket;
  repId?: string;
  q?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

function qs(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const api = {
  me: (cookieHeader?: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/me', { cookieHeader }),
  login: (email: string, password: string) =>
    apiFetch<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => apiFetch<void>('/api/auth/logout', { method: 'POST' }),

  team: (cookieHeader?: string) =>
    apiFetch<TeamMember[]>('/api/admin/task-team/members', { cookieHeader }),

  leads: {
    list: (params: ListLeadsParams = {}, cookieHeader?: string) =>
      apiFetch<Paginated<Lead>>(`/api/admin/sales/leads${qs(params as Record<string, string | number | undefined>)}`, { cookieHeader }),
    get: (id: string, cookieHeader?: string) =>
      apiFetch<Lead>(`/api/admin/sales/leads/${id}`, { cookieHeader }),
    create: (body: CreateLeadPayload) =>
      apiFetch<Lead>('/api/admin/sales/leads', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: UpdateLeadPayload) =>
      apiFetch<Lead>(`/api/admin/sales/leads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    moveStage: (id: string, stage: LeadStage, note?: string) =>
      apiFetch<Lead>(`/api/admin/sales/leads/${id}/stage`, {
        method: 'POST',
        body: JSON.stringify({ stage, note }),
      }),
    scheduleMeeting: (
      id: string,
      body: { calendarSlug: string; date: string; time: string; clientEmailOverride?: string; notes?: string },
    ) =>
      apiFetch<Lead>(`/api/admin/sales/leads/${id}/schedule-meeting`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    markWon: (id: string, body: { expectedValueSar?: number; contractTemplateSlug?: string; note?: string }) =>
      apiFetch<{ lead: Lead; deepLink: string }>(`/api/admin/sales/leads/${id}/mark-won`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    markLost: (id: string, lossReason?: string) =>
      apiFetch<Lead>(`/api/admin/sales/leads/${id}/mark-lost`, {
        method: 'POST',
        body: JSON.stringify({ lossReason }),
      }),
    remove: (id: string) =>
      apiFetch<void>(`/api/admin/sales/leads/${id}`, { method: 'DELETE' }),
    bulk: (body: { ids: string[]; action: 'delete' | 'setStage' | 'assign'; payload?: { stage?: LeadStage; repId?: string } }) =>
      apiFetch<{ ok: number; failed: { id: string; reason: string }[] }>('/api/admin/sales/leads/bulk', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  clients: {
    fromLead: (leadId: string) =>
      apiFetch<{ id: string; code: string; name: string; email: string | null }>(`/api/admin/clients/from-lead/${leadId}`, {
        method: 'POST',
        body: JSON.stringify({}),
      }),
  },

  activities: {
    list: (leadId: string, cookieHeader?: string) =>
      apiFetch<LeadActivity[]>(`/api/admin/sales/leads/${leadId}/activities`, { cookieHeader }),
    log: (
      leadId: string,
      body: { type: ActivityType; outcome?: string; note?: string; occurredAt?: string },
    ) =>
      apiFetch<LeadActivity>(`/api/admin/sales/leads/${leadId}/activities`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  targets: {
    list: (month?: string, cookieHeader?: string) =>
      apiFetch<SalesTarget[]>(`/api/admin/sales/targets${qs({ month })}`, { cookieHeader }),
    upsert: (body: { repId: string; month: string; revenueTargetSar: number; leadCountTarget?: number }) =>
      apiFetch<SalesTarget>('/api/admin/sales/targets', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  reports: {
    funnel: (cookieHeader?: string) =>
      apiFetch<FunnelBucket[]>('/api/admin/sales/reports/funnel', { cookieHeader }),
    leaderboard: (month?: string, cookieHeader?: string) =>
      apiFetch<RepLeaderboardEntry[] | RepLeaderboardEntry>(
        `/api/admin/sales/reports/leaderboard${qs({ month })}`,
        { cookieHeader },
      ),
    pipelineValue: (cookieHeader?: string) =>
      apiFetch<{ totalSar: number; openLeads: number }>('/api/admin/sales/reports/pipeline-value', {
        cookieHeader,
      }),
  },

  imports: {
    preview: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      const base = appConfig.apiUrl;
      const res = await fetch(`${base}/api/admin/sales/import/preview`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      });
      if (!res.ok) {
        let body: unknown = null;
        try { body = await res.json(); } catch {}
        throw new ApiError(res.status, body, 'Preview failed');
      }
      return res.json();
    },
    apply: (body: { rows: unknown[]; assignedRepId?: string }) =>
      apiFetch<{ created: number; skipped: number; total: number }>('/api/admin/sales/import/apply', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },

  exportUrl: (params: ListLeadsParams = {}) =>
    `${appConfig.apiUrl}/api/admin/sales/export${qs(params as Record<string, string | number | undefined>)}`,
};

export const STAGE_LABELS_AR: Record<LeadStage, string> = {
  NEW: 'جديد',
  CONTACTED: 'تم التواصل',
  QUALIFIED: 'مؤهل',
  MEETING_SCHEDULED: 'اجتماع محدد',
  MEETING_DONE: 'اجتماع مكتمل',
  PROPOSAL_SENT: 'تم إرسال العرض',
  NEGOTIATION: 'مفاوضات',
  WON: 'مغلق ناجح',
  LOST: 'مغلق خاسر',
  GHOSTED: 'لم يرد',
};

export const SOURCE_LABELS_AR: Record<LeadSource, string> = {
  FB: 'فيسبوك',
  IG: 'إنستجرام',
  GOOGLE: 'جوجل',
  REFERRAL: 'إحالة',
  WEBSITE: 'الموقع',
  COLD_OUTREACH: 'اتصال بارد',
  IMPORT: 'استيراد',
  OTHER: 'أخرى',
};

export const BUDGET_LABELS_AR: Record<BudgetBucket, string> = {
  UNDER_20K: 'أقل من 20 ألف',
  B20K_35K: '20 - 35 ألف',
  B35K_50K: '35 - 50 ألف',
  B50K_100K: '50 - 100 ألف',
  OVER_100K: 'أكثر من 100 ألف',
  UNKNOWN: 'غير محدد',
};

export const ACTIVITY_LABELS_AR: Record<ActivityType, string> = {
  WHATSAPP: 'واتساب',
  PHONE_CALL: 'مكالمة',
  EMAIL: 'بريد',
  MEETING: 'اجتماع',
  NOTE: 'ملاحظة',
};

export const OPEN_STAGES: LeadStage[] = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'MEETING_SCHEDULED',
  'MEETING_DONE',
  'PROPOSAL_SENT',
  'NEGOTIATION',
];
