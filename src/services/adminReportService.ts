import { createAdminClient } from '@/integrations/supabase/admin-client';
import { getTrueLimit, getPlanUtilizationRate } from '@/lib/payment-schedule';

export type MonthlyCsvParams = {
  year: number; // 4-digit reporting year (target month inclusive)
  month: number; // 1-12 reporting month (target month inclusive)
  page?: number; // 1-based page index for pagination
  pageSize?: number; // number of accounts per page
};

// Constants per spec
const FINANCIAL_CONSTANTS = {
  portfolioType: 'R',
  accountType: '7',
  termsDuration: 'Rev',
  termsFrequency: 'M',
  interestType: 'F',
};

// 9 headers default blank per spec
// (BLANK_HEADERS removed as it was unused)

// Mapping helpers (simple defaults; can be extended via business rules)
function mapAccountStatus(status: string | null): string {
  // Metro2-ish defaults: 11 = Current account, 13 = Paid/Closed
  if (!status) return '';
  const s = status.toLowerCase();
  if (s === 'active') return '11';
  if (s === 'cancelled' || s === 'closed') return '13';
  return '';
}

function mapPaymentRating(
  latestStatus: 'completed' | 'failed' | string | null
): string {
  // Leave blank unless there is a recent failure; then '1' as placeholder
  if (latestStatus === 'failed') return '1';
  return '';
}

// Build 24-month Metro2-style payment history profile string (oldest → newest)
// Codes used (simplified):
// 0 = Paid/Current for that month
// 1 = Delinquent/Failed payment that month
// D = Month after account closed
// B = Before account opened OR no payment data (inactive / not yet reporting)
// Assumptions: A single payment per month is sufficient to mark status; if multiple
// payments exist and any failed → 1; otherwise if any completed → 0.
function buildPaymentHistoryProfile(
  acct: { created_at: string | null; closed_at?: string | null; id: string },
  monthlyPayments: { status?: string | null; created_at?: string | null }[],
  targetYear: number,
  targetMonth: number
): string {
  // Map payments into year-month buckets: 'YYYY-MM'
  const bucketMap: Record<string, { failed: boolean; completed: boolean }> = {};
  for (const p of monthlyPayments) {
    if (!p.created_at) continue;
    const d = new Date(p.created_at);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = bucketMap[key] || { failed: false, completed: false };
    const status = (p.status || '').toLowerCase();
    if (status === 'failed') existing.failed = true;
    if (status === 'completed') existing.completed = true;
    bucketMap[key] = existing;
  }

  const createdAt = acct.created_at ? new Date(acct.created_at) : null;
  const closedAt = acct.closed_at ? new Date(acct.closed_at) : null;

  // Build an array of 24 months ending at target (inclusive), oldest first.
  const codes: string[] = [];
  for (let i = 23; i >= 0; i--) {
    const ref = new Date(targetYear, targetMonth - 1, 1); // first day of target month
    ref.setMonth(ref.getMonth() - i);
    const year = ref.getFullYear();
    const monthIdx = ref.getMonth(); // 0-based
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

    // Determine code for this month
    let code = 'B';

    // After closed → D (if closed exists and ref month is strictly after closure month)
    if (closedAt) {
      const closedMonth = new Date(
        closedAt.getFullYear(),
        closedAt.getMonth(),
        1
      );
      if (ref > closedMonth) {
        code = 'D';
        codes.push(code);
        continue;
      }
    }

    // Before opened → B
    if (createdAt) {
      const openedMonth = new Date(
        createdAt.getFullYear(),
        createdAt.getMonth(),
        1
      );
      if (ref < openedMonth) {
        code = 'B';
        codes.push(code);
        continue;
      }
    }

    // Within active window: check payment bucket
    const bucket = bucketMap[key];
    if (bucket) {
      if (bucket.failed) code = '1';
      else if (bucket.completed) code = '0';
      else code = 'B';
    } else {
      // No payments recorded that month; keep as 'B'
      code = 'B';
    }
    codes.push(code);
  }
  return codes.join('');
}

function mapECOA(): string {
  // Default to Individual account
  return '1';
}

function fmtDate(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${mm}/${dd}/${yyyy}`;
}

function maskSSNLastFour(ssnLastFour: string | null): string {
  if (!ssnLastFour) return '';
  const last4 = ssnLastFour.replace(/\D/g, '').slice(-4);
  return last4 ? `***-**-${last4}` : '';
}

function normalizePhone(phone: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '').slice(-10);
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthStart(y: number, m1to12: number): Date {
  return new Date(y, m1to12 - 1, 1);
}

function monthDiffInclusive(from: Date, to: Date): number {
  // Returns number of months between two month-start dates inclusive. If to < from, returns 0.
  const a = new Date(from.getFullYear(), from.getMonth(), 1);
  const b = new Date(to.getFullYear(), to.getMonth(), 1);
  if (b < a) return 0;
  return (
    (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()) + 1
  );
}

async function ensureConsumerAccountId(
  admin: ReturnType<typeof createAdminClient>,
  boosterAccountId: string
): Promise<number | null> {
  // Fetch current
  const { data: acct } = await admin
    .from('user_booster_accounts')
    .select('consumer_account_id')
    .eq('id', boosterAccountId)
    .single();

  // Supabase generated types may not yet include consumer_account_id; cast defensively
  const consumerAccountId = (acct as { consumer_account_id?: number } | null)
    ?.consumer_account_id;
  if (typeof consumerAccountId === 'number') return consumerAccountId;

  // Generate unique 7-digit
  for (let i = 0; i < 5; i++) {
    const candidate = Math.floor(1000000 + Math.random() * 9000000); // 7 digits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: exists } = (await (admin as unknown as any)
      .from('user_booster_accounts')
      .select('id')
      .eq('consumer_account_id', candidate)
      .maybeSingle()) as { data: { id: string } | null };
    if (!exists) {
      const { error } = await admin
        .from('user_booster_accounts')
        // Column not present in generated TS types yet; cast to any to satisfy compiler
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({ consumer_account_id: candidate } as any)
        .eq('id', boosterAccountId);
      if (!error) return candidate;
    }
  }
  return null;
}

// TODO: Apply month/year window; currently returns all active accounts
export async function generateMonthlyCSV(
  params: MonthlyCsvParams
): Promise<string> {
  const { year, month } = params;
  const page = params.page && params.page > 0 ? params.page : 1;
  const pageSize =
    params.pageSize && params.pageSize > 0 ? params.pageSize : 100;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const admin = createAdminClient();

  // Detect optional columns on user_personal_info to build a compatible SELECT
  async function hasCol(table: string, col: string): Promise<boolean> {
    try {
      const { error } = await admin.from(table).select(col).limit(0);
      if (error)
        return !/column\s+\w+\s+does not exist|column .* does not exist/i.test(
          error.message || ''
        );
      return true;
    } catch {
      return false;
    }
  }

  const baseUpiCols = [
    'first_name',
    'last_name',
    'ssn_last_four',
    'date_of_birth',
    'phone',
    'address',
    'city',
    'state',
    'zip_code',
  ];
  const optionalUpiCandidates = ['middle_initial', 'generation_code', 'address2'];
  const presentOptional: string[] = [];
  for (const c of optionalUpiCandidates) {
     
    if (await hasCol('user_personal_info', c)) presentOptional.push(c);
  }
  const upiCols = [...baseUpiCols, ...presentOptional];

  // Fetch paginated accounts joined with plan info and personal info
  const query = admin
    .from('user_booster_accounts')
    .select(
      `id, user_id, status, credit_limit, highest_credit_limit, created_at, closed_at, monthly_amount,
       booster_plans(plan_name)`
    )
    .order('created_at', { ascending: true })
    .range(from, to);

  const { data: accounts, error: acctErr } = await query;
  if (acctErr) {
    const annotated = new Error(acctErr.message);
    // @ts-expect-error attach PostgREST fields for API to serialize
    annotated.details = acctErr.details;
    // @ts-expect-error: 'hint' may not exist on Error, but we attach it for API serialization
    annotated.hint = acctErr.hint;
    // @ts-expect-error: 'code' is not a standard Error property, but we attach it for API serialization
    annotated.code = acctErr.code;
    // Provide simple source tag
    // @ts-expect-error: 'source' is not a standard Error property, but we attach it for API serialization
    annotated.source = 'accounts-query';
    throw annotated;
  }

  // CSV headers in requested order
  const headers = [
    'Consumer Account ID',
    'Portfolio Type',
    'Account Type',
    'Date Opened',
    'Credit Limit',
    'Highest Credit',
    'Terms Duration',
    'Terms Frequency',
    'Scheduled Monthly Payment Amt',
    'Actual Payment Amt',
    'Acct Status',
    'Payment Rating',
    'Payment History Profile',
    'Special Comment',
    'Compliance Condition Code',
    'Current Balance',
    'Amt Past Due',
    'Original Charge Off Amount',
    'Date of Acct Information',
    'Date of First Delinquency',
    'Date Closed',
    'Date of Last Payment',
    'Interest Type Indicator',
    'Last Name',
    'First Name',
    'Middle Name',
    'Generation Code',
    'SSN',
    'DOB',
    'Telephone Number',
    'ECOA Code',
    'Consumer Information Indicator',
    'Country Code',
    'First Line of Addr',
    'Second Line of Addr',
    'City',
    'State/Province',
    'Zip Code',
    'Address indicator',
    'Residence Code',
  ];

  // Build rows per account
  const rows: string[][] = [];

  type PersonalInfoJoined = {
    first_name?: string | null;
    last_name?: string | null;
    middle_initial?: string | null;
    generation_code?: string | null;
    ssn_last_four?: string | null;
    date_of_birth?: string | null;
    phone?: string | null;
    address?: string | null;
    address2?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  };

  type AccountJoined = {
    id: string;
    user_id: string;
    status: string | null;
    credit_limit: number | null;
    highest_credit_limit: number | null;
    created_at: string | null;
    closed_at?: string | null;
    monthly_amount?: number | null;
    booster_plans?: { plan_name?: string | null } | null;
  };

  // Bulk fetch personal info for all user_ids in this page
  const userIds = ((accounts || []) as unknown as AccountJoined[]).map(
    (a) => a.user_id
  );
  const upiSelect = ['user_id', ...upiCols].join(', ');
  const userInfoMap = new Map<string, PersonalInfoJoined>();
  if (userIds.length > 0) {
    const { data: upiRows, error: upiErr } = await admin
      .from('user_personal_info')
      .select(upiSelect)
      .in('user_id', userIds);
    if (!upiErr && upiRows) {
      for (const row of upiRows as unknown as (PersonalInfoJoined & {
        user_id: string;
      })[]) {
        userInfoMap.set(row.user_id, row);
      }
    }
  }

  for (const acct of (accounts || []) as unknown as AccountJoined[]) {
    const uinfo: PersonalInfoJoined = userInfoMap.get(acct.user_id) || {};

    // Payments: latest payment (for existing columns)
    const { data: lastPay } = await admin
      .from('payments')
      .select('amount, status, created_at')
      .eq('booster_account_id', acct.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Payments for history profile (24-month window)
    const targetDate = new Date(year, month - 1, 1); // first day of target month
    const startWindow = new Date(targetDate);
    startWindow.setMonth(startWindow.getMonth() - 23); // oldest month start
    const startISO = startWindow.toISOString();
    const endWindow = new Date(targetDate);
    endWindow.setMonth(endWindow.getMonth() + 1); // first day of month after target
    const endISO = endWindow.toISOString();

    const { data: windowPays } = await admin
      .from('payments')
      .select('status, created_at')
      .eq('booster_account_id', acct.id)
      .gte('created_at', startISO)
      .lt('created_at', endISO)
      .order('created_at', { ascending: true });

    // Scheduled payments distribution over 12 months with cents handling:
    // Base (regular) payment = floor(trueLimit/12 to 2 decimals)
    // Remainder cents are distributed by adding +$0.01 to the first payment.
    const creditLimit = Number(acct.credit_limit || 0);
    const planName = acct.booster_plans?.plan_name || '';
    const rate = getPlanUtilizationRate(planName);
    const trueLimit = getTrueLimit(creditLimit, rate);
    const base = Math.floor((trueLimit / 12) * 100) / 100; // e.g., 29.16 for $350.00 true limit
    const ceilFirst = Math.ceil((trueLimit / 12) * 100) / 100; // e.g., 29.17 for first month
    const regularPayment = round2(base); // typical monthly amount shown going forward (e.g., 29.16)
    const firstPayment = round2(ceilFirst); // first payment slightly higher (e.g., 29.17)

    // Count completed subscription payments up to target month (capped at 12)
    const completedPays = (windowPays || []).filter(
      (p) => (p.status || '').toLowerCase() === 'completed'
    );
    const completedByMonth = new Set(
      completedPays.map((p) => monthKey(new Date(p.created_at as string)))
    );
    // completedCount limited to 12 since True Limit amortizes over 12 months
    const completedCount = Math.min(12, completedByMonth.size);

    // Determine activation month = first completed payment month (if any)
    let activationMonth: Date | null = null;
    for (const p of completedPays) {
      const d = new Date(p.created_at as string);
      if (isNaN(d.getTime())) continue;
      if (!activationMonth || d < activationMonth)
        activationMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    }

    // Compute Amount Past Due using irregular first payment distribution
    // Expected months start at activation month, up to min(targetMonth, closedMonth), capped at 12
    const targetMonthStart = monthStart(year, month);
    const closedMonthStart = acct.closed_at
      ? new Date(
          new Date(acct.closed_at).getFullYear(),
          new Date(acct.closed_at).getMonth(),
          1
        )
      : null;
    let expectedCount = 0;
    if (activationMonth) {
      const end =
        closedMonthStart && closedMonthStart < targetMonthStart
          ? closedMonthStart
          : targetMonthStart;
      expectedCount = Math.min(12, monthDiffInclusive(activationMonth, end));
    }
    const expectedSum =
      expectedCount > 0
        ? round2(firstPayment + round2((expectedCount - 1) * regularPayment))
        : 0;
    const completedSum =
      completedCount > 0
        ? round2(firstPayment + round2((completedCount - 1) * regularPayment))
        : 0;
    const amountPastDue = Math.max(0, round2(expectedSum - completedSum));

    // Current balance = True Limit - sum of completed scheduled amounts (0 if not activated)
    const currentBalance = activationMonth
      ? Math.max(0, round2(trueLimit - completedSum))
      : 0;

    const lastPaymentDate = lastPay
      ? fmtDate(lastPay.created_at as string)
      : '';
    const lastPaymentAmount = lastPay ? Number(lastPay.amount) : 0;
    const paymentStatus = (lastPay?.status as string) || null;

    // Scheduled Payment Amount presented as the regular payment (post-first month)
    const scheduledPaymentAmount = regularPayment;

    const consumerId = await ensureConsumerAccountId(admin, acct.id);

    const row: string[] = [
      // Consumer Account ID
      consumerId !== null ? String(consumerId) : '',
      // Portfolio Type
      FINANCIAL_CONSTANTS.portfolioType,
      // Account Type
      FINANCIAL_CONSTANTS.accountType,
      // Date Opened
      fmtDate(acct.created_at as string),
      // Credit Limit
      acct.credit_limit != null ? String(acct.credit_limit) : '',
      // Highest Credit
      acct.highest_credit_limit != null
        ? String(acct.highest_credit_limit)
        : String(acct.credit_limit ?? ''),
      // Terms Duration
      FINANCIAL_CONSTANTS.termsDuration,
      // Terms Frequency
      FINANCIAL_CONSTANTS.termsFrequency,
      // Scheduled Monthly Payment Amt
      String(scheduledPaymentAmount || ''),
      // Actual Payment Amt
      String(lastPaymentAmount || ''),
      // Acct Status
      mapAccountStatus(acct.status as string),
      // Payment Rating
      mapPaymentRating(paymentStatus),
      // Payment History Profile
      buildPaymentHistoryProfile(
        { id: acct.id, created_at: acct.created_at, closed_at: acct.closed_at },
        windowPays || [],
        year,
        month
      ),
      // Special Comment
      '',
      // Compliance Condition Code
      '',
      // Current Balance
      String(currentBalance),
      // Amt Past Due
      String(amountPastDue),
      // Original Charge Off Amount
      '',
      // Date of Acct Information
      '',
      // Date of First Delinquency
      '',
      // Date Closed
      fmtDate(acct.closed_at as string),
      // Date of Last Payment
      lastPaymentDate,
      // Interest Type Indicator
      FINANCIAL_CONSTANTS.interestType,
      // Last Name
      uinfo.last_name || '',
      // First Name
      uinfo.first_name || '',
      // Middle Name
      uinfo.middle_initial || '',
      // Generation Code
      uinfo.generation_code || '',
      // SSN
      maskSSNLastFour(uinfo.ssn_last_four || ''),
      // DOB
      fmtDate(uinfo.date_of_birth || ''),
      // Telephone Number
      normalizePhone(uinfo.phone || ''),
      // ECOA Code
      mapECOA(),
      // Consumer Information Indicator
      '',
      // Country Code
      'US',
      // First Line of Addr
      uinfo.address || '',
      // Second Line of Addr
      uinfo.address2 || '',
      // City
      uinfo.city || '',
      // State/Province
      uinfo.state || '',
      // Zip Code
      uinfo.zip_code || '',
      // Address indicator
      '',
      // Residence Code
      '',
    ];

    rows.push(
      row.map((v) => (v ?? '').toString().replace(/\r?\n/g, ' ').trim())
    );
  }

  // Assemble CSV
  const csvLines = [
    headers.join(','),
    ...rows.map((r) => r.map(csvEscape).join(',')),
  ];
  return csvLines.join('\n');
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}
