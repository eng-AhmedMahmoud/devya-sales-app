export type UserRole =
  | 'ADMIN'
  | 'SUPER_ADMIN'
  | 'TEAM'
  | 'SALES_REP'
  | 'SALES_MANAGER';

export type LeadStage =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_DONE'
  | 'PROPOSAL_SENT'
  | 'NEGOTIATION'
  | 'WON'
  | 'LOST'
  | 'GHOSTED';

export type LeadSource =
  | 'FB'
  | 'IG'
  | 'GOOGLE'
  | 'REFERRAL'
  | 'WEBSITE'
  | 'COLD_OUTREACH'
  | 'IMPORT'
  | 'OTHER';

export type BudgetBucket =
  | 'UNDER_20K'
  | 'B20K_35K'
  | 'B35K_50K'
  | 'B50K_100K'
  | 'OVER_100K'
  | 'UNKNOWN';

export type PipelineOutcome = 'OPEN' | 'WON' | 'LOST' | 'GHOSTED';

export type ActivityType = 'WHATSAPP' | 'PHONE_CALL' | 'EMAIL' | 'MEETING' | 'NOTE';

export type LeadEventType =
  | 'CREATED'
  | 'ASSIGNED'
  | 'STAGE_CHANGED'
  | 'ACTIVITY_LOGGED'
  | 'MEETING_SCHEDULED'
  | 'MEETING_COMPLETED'
  | 'BUDGET_UPDATED'
  | 'WON'
  | 'LOST'
  | 'CONTRACT_LINKED'
  | 'IMPORTED'
  | 'DELETED';

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  mustChangePassword?: boolean;
}

export interface LeadActivity {
  id: string;
  leadId: string;
  type: ActivityType;
  outcome: string | null;
  note: string | null;
  occurredAt: string;
  actorId: string | null;
  actorName: string | null;
  actor?: { id: string; name: string | null } | null;
}

export interface LeadEvent {
  id: string;
  leadId: string;
  type: LeadEventType;
  payload: unknown;
  detail: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
  actor?: { id: string; name: string | null } | null;
}

export interface Booking {
  id: string;
  calendarType: string;
  scheduledAt: string;
  durationMinutes: number;
  clientName: string;
  clientEmail: string | null;
  status: string;
}

export interface Lead {
  id: string;
  code: string;
  clientName: string;
  companyName: string | null;
  jobTitle: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  industry: string | null;
  targetAudience: string | null;
  notes: string | null;
  budget: BudgetBucket;
  expectedValueSar: number | null;
  source: LeadSource;
  campaignName: string | null;
  stage: LeadStage;
  outcome: PipelineOutcome;
  assignedRepId: string | null;
  assignedRep?: { id: string; name: string | null; email: string } | null;
  assignedRepName: string | null;
  createdById: string | null;
  createdBy?: { id: string; name: string | null } | null;
  bookingId: string | null;
  booking?: Booking | null;
  contractId: string | null;
  firstContactedAt: string | null;
  lastActivityAt: string | null;
  meetingScheduledAt: string | null;
  wonAt: string | null;
  lostAt: string | null;
  lossReason: string | null;
  creationDay: string;
  createdAt: string;
  updatedAt: string;
  activities?: LeadActivity[];
  events?: LeadEvent[];
}

export interface FunnelBucket {
  stage: LeadStage;
  count: number;
}

export interface RepLeaderboardEntry {
  repId: string;
  name: string;
  open: number;
  won: number;
  lost: number;
  revenueSar: number;
  target: number | null;
  attainment: number | null;
}

export interface SalesTarget {
  id: string;
  repId: string;
  month: string;
  revenueTargetSar: number;
  leadCountTarget: number | null;
  rep?: { id: string; name: string | null; email: string };
}

export interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
}
