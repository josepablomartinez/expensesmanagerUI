import { localISODate } from "@/lib/date";

const API_URL = import.meta.env.VITE_API_URL;

// What the bank originally charged, for an expense that arrived in a
// currency other than CRC/USD and was converted to USD by the n8n workflow.
// See API/README.md's GET /expenses section. `note` is n8n's explanation of
// the conversion -- kept off Expense.motive so that field stays free for the
// user's own note once they've reviewed the expense.
export interface ForeignCurrency {
  original_amount: number;
  original_currency: string;
  original_currency_name: string;
  fx_rate_dollar_based: number | null;
  fx_rate_date: string | null;
  fx_source: string | null;
  note: string | null;
}

export interface Expense {
  id: number;
  country: string | null;
  city: string | null;
  merchant: string | null;
  authorization: string | null;
  currency: string | null;
  date: string;
  hour: string | null;
  amount: number | null;
  colones_amount: number | null;
  dollars_amount: number | null;
  category_id: number | null;
  category_name?: string | null;
  budget_colones?: number | null;
  confidence: number | null;
  entity: string;
  type: string | null;
  motive: string | null;
  reviewed: boolean | null;
  credit_card_id: number | null;
  debit_card_id: number | null;
  // From whichever card (credit or debit) is set.
  card_type?: string | null;
  card_last4?: string | null;
  flag_type: string | null;
  flag_reason: string | null;
  payment_date: string;
  foreign: ForeignCurrency | null;
}

export interface DayExpenses {
  date: string;
  total_crc: number;
  total_usd: number;
  expenses: Expense[];
}

export interface Category {
  id: number;
  category: string;
  subcategory: string;
  budget: number | null;
  main_category_id: number;
  budget_currency: string | null; // CRC/USD; null when no budget is set
}

export interface MainCategory {
  id: number;
  name: string;
}

export interface BudgetVsActual {
  category_id: number;
  main_category_id: number;
  category_name: string;
  budget: number | null; // as the user set it, in budget_currency
  budget_currency: string | null;
  // budget converted at today's rate -- what to compare spend against.
  budget_colones: number | null;
  budget_dollars: number | null;
  actual_crc: number;
  actual_usd: number;
  pct_used: number | null;
}

export interface PaymentWindowRow {
  category_id: number;
  main_category_id: number;
  category_name: string;
  month_start: string; // YYYY-MM-DD, first day of the payment month
  budget: number | null; // as the user set it, in budget_currency
  budget_currency: string | null;
  // budget converted at today's rate -- what to compare spend against.
  budget_colones: number | null;
  budget_dollars: number | null;
  spent_crc: number;
  spent_usd: number;
}

export interface BudgetBurndownRow {
  category_id: number;
  category_name: string;
  // Sum of the subcategory budgets, each converted at today's rate (they
  // can be in different currencies, so there's no original-currency total).
  budget_colones: number | null;
  budget_dollars: number | null;
  date: string;
  daily_crc: number;
  daily_usd: number;
  cumulative_crc: number;
  cumulative_usd: number;
  expected_crc: number;
  expected_usd: number;
}

export interface BudgetBurndownBySubcategoryRow {
  subcategory_id: number;
  subcategory_name: string;
  budget: number | null; // as the user set it, in budget_currency
  budget_currency: string | null;
  // budget converted at today's rate -- what to compare spend against.
  budget_colones: number | null;
  budget_dollars: number | null;
  date: string;
  daily_crc: number;
  daily_usd: number;
  cumulative_crc: number;
  cumulative_usd: number;
  expected_crc: number;
  expected_usd: number;
}

export interface CategoryMonthMatrixRow {
  subcategoria_id: number;
  subcategoria_nombre: string;
  month: number;
  total_crc: number;
  total_usd: number;
}

export interface BulkApproveResult {
  approved_ids: number[];
  count: number;
}

export interface MerchantRule {
  id: number;
  commerce_pattern: string;
  category_id: number;
  active: boolean;
}

export interface Settings {
  id: number;
  display_currency: string;
  favorite_banks: string[];
  favorite_category_ids: number[];
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  language: string;
  exchange_rate_source: string;
  exchange_rate_bank_id: number | null;
  credit_card_expense_date: string;
  alerts_enabled: boolean;
  duplicate_alerts_enabled: boolean;
  suspicious_alerts_enabled: boolean;
  suspicious_z_threshold: number;
  suspicious_median_ratio: number;
  quiet_hours_start: number;
  quiet_hours_end: number;
  recurrent_grace_days: number;
  updated_at: string;
}

export interface UpdateSettingsRequest {
  display_currency?: string;
  favorite_banks?: string[];
  favorite_category_ids?: number[];
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  language?: string;
  exchange_rate_source?: string;
  exchange_rate_bank_id?: number | null;
  credit_card_expense_date?: string;
  alerts_enabled?: boolean;
  duplicate_alerts_enabled?: boolean;
  suspicious_alerts_enabled?: boolean;
  suspicious_z_threshold?: number;
  suspicious_median_ratio?: number;
  quiet_hours_start?: number;
  quiet_hours_end?: number;
  recurrent_grace_days?: number;
}

export interface AlertPayload {
  template_key?: string;
  params?: {
    merchant?: string | null;
    amount?: number | null;
    matched_expense_id?: number;
    currency?: string | null;
    colones_amount?: number | null;
    dollars_amount?: number | null;
    // alert.suspicious_amount
    median_colones?: number;
    median_dollars?: number | null;
    ratio?: number;
    z_score?: number | null;
    sample_size?: number;
    // alert.suspicious_hour
    hour_event?: string;
    quiet_hours_start?: number;
    quiet_hours_end?: number;
  };
}

export interface ExpenseAlert {
  id: number;
  type: string;
  severity: string;
  related_expense_id: number | null;
  destination: string | null;
  payload: AlertPayload;
  read_at: string | null;
  dismissed_at: string | null;
  resolved_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AlertList {
  current: ExpenseAlert[];
  earlier: ExpenseAlert[];
}

export interface Bank {
  id: number;
  name: string;
  code: string;
}

export interface ExchangeRateLatest {
  bank_id: number;
  code: string;
  name: string;
  date: string;
  buy_price: number;
  sell_price: number;
}

export type CardType = "mastercard" | "visa" | "amex";

export interface ExchangeRateHistoryRow {
  date: string;
  buy_price: number;
  sell_price: number;
}

// One subcategory's spend on a card in its open statement cycle; a null
// category is the card's uncategorized spend.
export interface CreditCardCycleRow {
  category_id: number | null;
  main_category_id: number | null;
  category_name: string | null;
  cycle_start: string;
  cycle_end: string;
  spent_crc: number;
  spent_usd: number;
}

export interface CreditCard {
  id: number;
  bank_id: number;
  bank_name: string;
  card_type: CardType;
  last4: string;
  credit_limit: number;
  limit_currency: string;
  cutoff_day: number | null;
  due_day: number | null;
  active: boolean;
}

export interface CreateCreditCardRequest {
  bank_id: number;
  card_type: CardType;
  last4: string;
  credit_limit: number;
  limit_currency?: string;
  cutoff_day?: number;
  due_day?: number;
}

export interface UpdateCreditCardRequest {
  card_type?: CardType;
  last4?: string;
  credit_limit?: number;
  limit_currency?: string;
  cutoff_day?: number;
  due_day?: number;
  active?: boolean;
}

export interface DebitCard {
  id: number;
  bank_id: number;
  bank_name: string;
  card_type: CardType;
  last4: string;
  active: boolean;
}

export interface CreateDebitCardRequest {
  bank_id: number;
  card_type: CardType;
  last4: string;
}

export interface UpdateDebitCardRequest {
  card_type?: CardType;
  last4?: string;
  active?: boolean;
}

export interface CreateExpenseRequest {
  country?: string;
  city?: string;
  merchant?: string;
  authorization?: string;
  currency: string;
  date: string; // YYYY-MM-DD
  hour?: string; // HH:MM
  amount: number;
  category_id?: number;
  entity: string;
  type: string; // CARD/CASH/SINPE
  motive?: string;
  amount_colones?: number; // required when currency is USD
  credit_card_id?: number;
  // "Mark as paid" on a pending recurrent expense: sent together, and the
  // new expense marks that period paid directly (no confirm step).
  recurrent_expense_id?: number;
  recurrent_period?: string; // YYYY-MM
}

// A fixed monthly payment (loan, subscription, ...). One per subcategory;
// amount/currency are that subcategory's budget. See API/README.md's
// "Recurrent expenses" section.
export interface RecurrentExpense {
  id: number;
  category_id: number;
  category_name: string;
  name: string;
  day_of_month: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  amount: number | null;
  currency: string | null;
}

export interface RecurrentExpenseRequest {
  name: string;
  day_of_month: number;
  start_date: string | null; // YYYY-MM-DD
  end_date: string | null;
}

export type RecurrentStatus = "overdue" | "matched" | "pending";

// One card in the review tab's Recurring section: a recurrence's next
// period that isn't paid or skipped yet. expense_* are only set when
// status is "matched" (the expense the DB linked, waiting for confirmation).
// previous_* describe the month right before, when it was paid or skipped
// -- the card's "September paid · Undo" line.
export interface RecurrentDue {
  recurrent_expense_id: number;
  name: string;
  category_id: number;
  category_name: string;
  period: string;
  due_date: string;
  days_until_due: number;
  status: RecurrentStatus;
  amount: number | null;
  currency: string | null;
  expense_id: number | null;
  expense_date: string | null;
  expense_amount: number | null;
  expense_currency: string | null;
  expense_merchant: string | null;
  previous_period: string | null;
  previous_status: "paid" | "skipped" | null;
  previous_expense_id: number | null;
  previous_expense_date: string | null;
  previous_expense_amount: number | null;
  previous_expense_currency: string | null;
  previous_expense_merchant: string | null;
}

export interface RecurrentPeriodResult {
  recurrent_expense_id: number;
  period: string;
  status: "paid" | "pending" | "skipped";
  expense_id: number | null;
}

// An expense that can be linked to a period by hand. linked_* are set when
// it's already linked somewhere: "matched" can be moved, "paid" can't.
export interface RecurrentCandidate {
  expense_id: number;
  date_event: string;
  amount: number | null;
  currency: string | null;
  merchant: string | null;
  reviewed: boolean;
  linked_period: string | null;
  linked_status: "matched" | "paid" | null;
}

export interface SplitRequest {
  amount: number;
  category_id?: number;
  reason?: string;
}

export interface SplitResult {
  id: number;
  parent_expense_id: number;
  amount: number;
  category_id: number | null;
}

export interface DeleteExpenseRequest {
  deleted_reason: string;
}

export interface DeleteExpenseResult {
  id: number;
  deleted: boolean;
  deleted_reason: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  is_owner: boolean;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    // Session-cookie auth (see session-auth-spec.md) -- the API sets an
    // HttpOnly cookie on login, and the browser attaches it automatically
    // on every request from here on. No token to read or attach ourselves.
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}) as { error?: string });
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ status: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),
    me: () => request<AuthUser>("/auth/me"),
  },
  expenses: {
    review: (minConfidence = 1.0) =>
      request<Expense[]>(`/expenses/review?min_confidence=${minConfidence}`),
    list: (params: { from: string; to: string; categoryId?: number; type?: string; entity?: string; limit?: number; offset?: number; dateField?: "event" | "payment"; q?: string }) => {
      const q = new URLSearchParams({ from: params.from, to: params.to });
      if (params.categoryId) q.set("category_id", String(params.categoryId));
      if (params.type) q.set("type", params.type);
      if (params.entity) q.set("entity", params.entity);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
      if (params.dateField) q.set("date_field", params.dateField);
      if (params.q?.trim()) q.set("q", params.q.trim());
      return request<{ days: DayExpenses[] }>(`/expenses?${q}`);
    },
    updateCategory: (id: number, categoryId: number) =>
      request<{ id: number; category_id: number; reviewed: boolean }>(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify({ category_id: categoryId }),
      }),
    update: (
      id: number,
      body: { amount?: number; categoryId?: number; reason?: string; creditCardId?: number },
    ) =>
      request<{
        id: number;
        amount: number;
        category_id: number | null;
        reason: string | null;
        reviewed: boolean;
        credit_card_id: number | null;
      }>(`/expenses/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...(body.amount !== undefined ? { amount: body.amount } : {}),
          ...(body.categoryId !== undefined ? { category_id: body.categoryId } : {}),
          ...(body.reason !== undefined ? { reason: body.reason } : {}),
          ...(body.creditCardId !== undefined ? { credit_card_id: body.creditCardId } : {}),
        }),
      }),
    bulkApprove: (ids: number[]) =>
      request<BulkApproveResult>(`/expenses/bulk-approve`, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    create: (body: CreateExpenseRequest) =>
      request<{ id: number }>(`/expenses`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    split: (id: number, body: SplitRequest) =>
      request<SplitResult>(`/expenses/${id}/split`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    delete: (id: number, body: DeleteExpenseRequest) =>
      request<DeleteExpenseResult>(`/expenses/${id}`, {
        method: "DELETE",
        body: JSON.stringify(body),
      }),
    clearFlag: (id: number) =>
      request<void>(`/events/anomaly/${id}`, {
        method: "DELETE",
      }),
  },
  categories: {
    list: () => request<Category[]>("/categories"),
    create: (body: { mainCategoryId: number; subcategory: string; budget?: number }) =>
      request<Category>("/categories", {
        method: "POST",
        body: JSON.stringify({
          main_category_id: body.mainCategoryId,
          subcategory: body.subcategory,
          ...(body.budget !== undefined ? { budget: body.budget } : {}),
        }),
      }),
    update: (id: number, body: { subcategory?: string; budget?: number }) =>
      request<Category>(`/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    updateBudget: (id: number, budget: number, currency?: string) =>
      request<{ user_id: number; category_id: number; budget: number; currency: string }>(`/categories/${id}/budget`, {
        method: "PUT",
        body: JSON.stringify({ budget, ...(currency ? { currency } : {}) }),
      }),
  },
  mainCategories: {
    list: () => request<MainCategory[]>("/main-categories"),
    create: (name: string) =>
      request<MainCategory>("/main-categories", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    update: (id: number, name: string) =>
      request<MainCategory>(`/main-categories/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name }),
      }),
  },
  merchantRules: {
    create: (body: { commercePattern: string; categoryId: number }) =>
      request<MerchantRule>(`/merchant/rules`, {
        method: "POST",
        body: JSON.stringify({ commerce_pattern: body.commercePattern, category_id: body.categoryId }),
      }),
  },
  settings: {
    get: () => request<Settings>("/settings"),
    update: (body: UpdateSettingsRequest) =>
      request<Settings>("/settings", { method: "PUT", body: JSON.stringify(body) }),
  },
  alerts: {
    list: (limit = 50, offset = 0) => request<AlertList>(`/alerts?limit=${limit}&offset=${offset}`),
    unreadCount: () => request<{ count: number }>("/alerts/unread-count"),
    markRead: (id: number) => request<ExpenseAlert>(`/alerts/${id}/read`, { method: "PATCH" }),
    markAllRead: () => request<{ marked_read: number }>("/alerts/mark-all-read", { method: "POST" }),
    dismiss: (id: number) => request<ExpenseAlert>(`/alerts/${id}/dismiss`, { method: "PATCH" }),
  },
  banks: {
    list: () => request<Bank[]>("/banks"),
  },
  exchangeRates: {
    list: () => request<ExchangeRateLatest[]>("/exchange-rates"),
  },
  creditCards: {
    list: () => request<CreditCard[]>("/credit-cards"),
    create: (body: CreateCreditCardRequest) =>
      request<CreditCard>("/credit-cards", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: UpdateCreditCardRequest) =>
      request<CreditCard>(`/credit-cards/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  },
  debitCards: {
    list: () => request<DebitCard[]>("/debit-cards"),
    create: (body: CreateDebitCardRequest) =>
      request<DebitCard>("/debit-cards", { method: "POST", body: JSON.stringify(body) }),
    update: (id: number, body: UpdateDebitCardRequest) =>
      request<DebitCard>(`/debit-cards/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  },
  recurrent: {
    list: () => request<RecurrentExpense[]>("/recurrent-expenses"),
    create: (body: RecurrentExpenseRequest & { category_id: number }) =>
      request<RecurrentExpense>("/recurrent-expenses", { method: "POST", body: JSON.stringify(body) }),
    // Full replace: a null start_date/end_date clears it.
    update: (id: number, body: RecurrentExpenseRequest & { active: boolean }) =>
      request<RecurrentExpense>(`/recurrent-expenses/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: number) => request<{ id: number }>(`/recurrent-expenses/${id}`, { method: "DELETE" }),
    // today is the caller's local date, so "overdue" flips at local
    // midnight rather than the database's (UTC).
    due: () => request<RecurrentDue[]>(`/recurrent-expenses/due?today=${localISODate(new Date())}`),
    // period is YYYY-MM.
    confirm: (id: number, period: string) =>
      request<RecurrentPeriodResult>(`/recurrent-expenses/${id}/periods/${period}/confirm`, { method: "POST" }),
    reject: (id: number, period: string) =>
      request<RecurrentPeriodResult>(`/recurrent-expenses/${id}/periods/${period}/reject`, { method: "POST" }),
    skip: (id: number, period: string) =>
      request<RecurrentPeriodResult>(`/recurrent-expenses/${id}/periods/${period}/skip`, { method: "POST" }),
    // Takes back a paid or skipped period; a linked expense stays as-is.
    undo: (id: number, period: string) =>
      request<RecurrentPeriodResult>(`/recurrent-expenses/${id}/periods/${period}/undo`, { method: "POST" }),
    candidates: (id: number, period: string) =>
      request<RecurrentCandidate[]>(`/recurrent-expenses/${id}/periods/${period}/candidates`),
    link: (id: number, period: string, expenseId: number) =>
      request<RecurrentPeriodResult>(`/recurrent-expenses/${id}/periods/${period}/link`, {
        method: "POST",
        body: JSON.stringify({ expense_id: expenseId }),
      }),
  },
  reports: {
    budgetVsActual: (year: number, month: number) =>
      request<BudgetVsActual[]>(`/reports/budget-vs-actual?year=${year}&month=${month}`),
    // Window ends next month and walks back monthsBack months from `today`
    // (the caller's local date, so it can't drift to UTC's day).
    paymentWindow: (monthsBack: number, mainCategoryId?: number) => {
      const q = new URLSearchParams({ months_back: String(monthsBack), today: localISODate(new Date()) });
      if (mainCategoryId) q.set("main_category_id", String(mainCategoryId));
      return request<PaymentWindowRow[]>(`/reports/payment-window?${q}`);
    },
    burndown: (year: number, month: number, categoryId?: number) => {
      const q = new URLSearchParams({ year: String(year), month: String(month) });
      if (categoryId) q.set("category_id", String(categoryId));
      return request<BudgetBurndownRow[]>(`/reports/burndown?${q}`);
    },
    burndownBySubcategory: (year: number, month: number, categoryId: number) =>
      request<BudgetBurndownBySubcategoryRow[]>(
        `/reports/burndown-by-subcategory?year=${year}&month=${month}&category_id=${categoryId}`,
      ),
    categoryMonthMatrix: (year: number, categoryId: number) =>
      request<CategoryMonthMatrixRow[]>(
        `/reports/category-month-matrix?year=${year}&category_id=${categoryId}`,
      ),
    // Window ends at the bank's latest rate on file, not today.
    exchangeRateHistory: (bankId: number, days: number) =>
      request<ExchangeRateHistoryRow[]>(`/reports/exchange-rate-history?bank_id=${bankId}&days=${days}`),
    // Statement cycle containing the caller's local today.
    creditCardCycle: (cardId: number) =>
      request<CreditCardCycleRow[]>(`/reports/credit-card-cycle?card_id=${cardId}&today=${localISODate(new Date())}`),
  },
};

export { ApiError };
