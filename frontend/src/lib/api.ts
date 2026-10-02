// Django Backend API Client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export async function fetchFromApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`API error (${res.status}): ${errorBody}`);
  }

  return res.json();
}

export const hotelApi = {
  // Rooms & Categories
  getCategories: () => fetchFromApi<any[]>("/rooms/categories/"),
  getCategoryBySlug: (slug: string) => fetchFromApi<any>(`/rooms/categories/${slug}/`),
  getRooms: () => fetchFromApi<any[]>("/rooms/rooms/"),
  updateRoomStatus: (roomId: number, status: string) =>
    fetchFromApi(`/rooms/rooms/${roomId}/update-status/`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // Addons & Experiences
  getAddons: () => fetchFromApi<any[]>("/reservations/addons/"),

  // Bookings & Reservations
  createReservation: (data: any) =>
    fetchFromApi("/reservations/bookings/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getReservationByRef: (ref: string) =>
    fetchFromApi<any>(`/reservations/bookings/${ref}/`),
  expressCheckin: (ref: string, data: { estimated_arrival_time?: string; special_requests?: string }) =>
    fetchFromApi(`/reservations/bookings/${ref}/express-checkin/`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Payments
  initiatePayment: (data: { reservation_id: number; gateway: string; amount_npr?: number }) =>
    fetchFromApi("/payments/transactions/initiate/", {
      method: "POST",
      body: JSON.stringify(data),
      }),
};

export const onboardingApi = {
  checkSlug: (slug: string) =>
    fetchFromApi<{ available: boolean; slug: string; suggestions?: string[] }>(
      "/onboarding/check-slug",
      { method: "POST", body: JSON.stringify({ slug }) }
    ),

  createTenant: (data: {
    hotel_name: string;
    slug: string;
    region?: string;
    owner_email: string;
    owner_password?: string;
    primary_currency?: string;
    require_approval?: boolean;
  }) =>
    fetchFromApi<{
      message: string;
      tenant_slug: string;
      owner_email: string;
      verification_token: string;
    }>("/onboarding/create-tenant", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    fetchFromApi<{ message: string; tenant_slug: string; owner_email: string }>(
      "/onboarding/verify-email",
      { method: "POST", body: JSON.stringify({ token }) }
    ),

  configureTax: (data: {
    tenant_slug: string;
    tax_type?: string;
    tax_rate?: string | number;
    tax_registration_number?: string;
    primary_currency?: string;
  }) =>
    fetchFromApi<{
      message: string;
      tenant_slug: string;
      tax_type: string;
      tax_rate: string;
      primary_currency: string;
    }>("/onboarding/configure-tax", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  configurePayment: (data: {
    tenant_slug: string;
    gateway: string;
    merchant_id: string;
    secret_key: string;
    api_endpoint?: string;
    test_mode?: boolean;
  }) =>
    fetchFromApi<{
      message: string;
      tenant_slug: string;
      gateway: string;
      is_active: boolean;
    }>("/onboarding/configure-payment", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createRooms: (data: { tenant_slug: string; categories: any[] }) =>
    fetchFromApi<{
      message: string;
      categories: { name: string; slug: string }[];
    }>("/onboarding/create-rooms", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  completeOnboarding: (data: {
    tenant_slug: string;
    submit_for_approval?: boolean;
  }) =>
    fetchFromApi<{
      message: string;
      tenant_slug: string;
      status: string;
      hotel_name: string;
    }>("/onboarding/complete", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

