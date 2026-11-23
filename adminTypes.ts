export type AdminPlan = 'FREE' | 'STARTER' | 'PRO';

export interface AdminAccount {
  id: string;
  name: string;
  plan: AdminPlan;
  createdAt: string | null;
  lastActive: string | null;
  termsAccepted: boolean;
  unlockedLevels: number | null;
  stars: number | null;
}

export interface AdminAccounts {
  summary: {
    total: number;
    newLast7Days: number;
    activeToday: number;
    withTerms: number;
    withoutRegistrationDate: number;
    free: number;
    starter: number;
    pro: number;
  };
  profiles: AdminAccount[];
  filteredTotal: number;
  page: number;
  pageSize: number;
}

export type AdminPaymentStatus = 'approved' | 'pending' | 'refunded' | 'rejected' | 'cancelled' | 'disputed' | 'other';

export interface AdminPayment {
  id: string;
  source: 'payment' | 'order';
  profileId: string;
  tier: Exclude<AdminPlan, 'FREE'>;
  status: AdminPaymentStatus;
  amountCents: number;
  createdAt: string;
}

export interface AdminPayments {
  status: 'available' | 'partial' | 'unavailable' | 'unconfigured';
  entries: AdminPayment[];
  periodDays: number;
}
