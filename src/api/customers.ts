import { api } from "./client";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  total_orders: number;
  total_spend: number;
  last_order_date: string | null;
  tags: string | null;           // JSON array string — use parseTags() from utils
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  amount: number;
  product_category: string;
  status: string;
  created_at: string;
}

export interface CustomerDetail extends Customer {
  orders: Order[];
}

export interface CustomerListResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerCreate {
  name: string;
  email: string;
  phone: string;
  city: string;
  gender: string;
  tags?: string[];
}

export const customersApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params
      ? "?" + new URLSearchParams(params as Record<string, string>).toString()
      : "";
    return api.get<CustomerListResponse>(`/customers${qs}`);
  },
  get: (id: string) => api.get<CustomerDetail>(`/customers/${id}`),
  create: (data: CustomerCreate) => api.post<Customer>("/customers", data),
};
