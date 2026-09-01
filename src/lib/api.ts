const API_URL = import.meta.env.VITE_API_URL;

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
  budget?: number | null;
  confidence: number | null;
  entity: string;
  type: string | null;
  motive: string | null;
  reviewed: boolean | null;
  credit_card_id: number | null;
  card_type?: string | null;
  card_last4?: string | null;
  flag_type: string | null;
  flag_reason: string | null;
  payment_date: string;
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
}

export interface MainCategory {
  id: number;
  name: string;
}

export interface BudgetVsActual {
  category_id: number;
  main_category_id: number;
  category_name: string;
  budget: number | null;
  budget_usd: number | null;
  actual_crc: number;
  actual_usd: number;
  pct_used: number | null;
}

export interface BudgetBurndownRow {
  category_id: number;
  category_name: string;
  budget: number | null;
  budget_usd: number | null;
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
  budget: number | null;
  budget_usd: number | null;
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

// Token accessor is injected by AuthProvider so this module doesn't depend on
// React context directly (keeps api.ts usable from anywhere, incl. non-component code).
let getToken: () => string | null = () => null;
export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
  expenses: {
    review: (minConfidence = 1.0) =>
      request<Expense[]>(`/expenses/review?min_confidence=${minConfidence}`),
    list: (params: { from: string; to: string; categoryId?: number; type?: string; entity?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams({ from: params.from, to: params.to });
      if (params.categoryId) q.set("category_id", String(params.categoryId));
      if (params.type) q.set("type", params.type);
      if (params.entity) q.set("entity", params.entity);
      if (params.limit) q.set("limit", String(params.limit));
      if (params.offset) q.set("offset", String(params.offset));
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
    updateBudget: (id: number, budget: number) =>
      request<{ user_id: number; category_id: number; budget: number }>(`/categories/${id}/budget`, {
        method: "PUT",
        body: JSON.stringify({ budget }),
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
  reports: {
    budgetVsActual: (year: number, month: number) =>
      request<BudgetVsActual[]>(`/reports/budget-vs-actual?year=${year}&month=${month}`),
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
  },
};

export { ApiError };
