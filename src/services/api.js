// Production da VITE_API_URL, development da Vite proxy orqali /api
const BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

// ─── Token helpers ────────────────────────────────────────────────
export const getToken  = ()    => localStorage.getItem("rm_token");
export const setToken  = (t)   => localStorage.setItem("rm_token", t);
export const clearAuth = ()    => { localStorage.removeItem("rm_token"); localStorage.removeItem("rm_user"); };

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Xatolik yuz berdi");
  return data;
};

// ─── AUTH ─────────────────────────────────────────────────────────
export const authAPI = {
  // Telefon raqamga kod yuborish (console.log da ko'rinadi)
  sendCode: (phone) =>
    fetch(`${BASE}/auth/send-code`, { method: "POST", headers: headers(), body: JSON.stringify({ phone }) }).then(handle),

  register: (body) =>
    fetch(`${BASE}/auth/register`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  login: (body) =>
    fetch(`${BASE}/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  me: () =>
    fetch(`${BASE}/auth/me`, { headers: headers() }).then(handle),

  updateMe: (body) =>
    fetch(`${BASE}/auth/me`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handle),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────
export const productsAPI = {
  // Barcha mahsulotlar (o'zinikidan tashqari)
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return fetch(`${BASE}/products${qs ? "?" + qs : ""}`, { headers: headers() }).then(handle);
  },

  // Faqat o'z mahsulotlari
  getMy: () =>
    fetch(`${BASE}/products/my`, { headers: headers() }).then(handle),

  create: (body) =>
    fetch(`${BASE}/products`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  update: (id, body) =>
    fetch(`${BASE}/products/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handle),

  remove: (id) =>
    fetch(`${BASE}/products/${id}`, { method: "DELETE", headers: headers() }).then(handle),
};

// ─── OFFERS ───────────────────────────────────────────────────────
export const offersAPI = {
  send: (productId, message = "") =>
    fetch(`${BASE}/offers`, { method: "POST", headers: headers(), body: JSON.stringify({ productId, message }) }).then(handle),

  getReceived: () =>
    fetch(`${BASE}/offers`, { headers: headers() }).then(handle),

  getSent: () =>
    fetch(`${BASE}/offers/sent`, { headers: headers() }).then(handle),

  markPaid: (id) =>
    fetch(`${BASE}/offers/${id}/paid`, { method: "PUT", headers: headers() }).then(handle),
};

// ─── PAYMENTS (PostgreSQL) ─────────────────────────────────────────
export const paymentsAPI = {
  // To'lov yuborish (buyer)
  send: (body) =>
    fetch(`${BASE}/payments`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),

  // To'lovni tasdiqlash (seller)
  confirm: (offerId) =>
    fetch(`${BASE}/payments/${offerId}/confirm`, { method: "PUT", headers: headers() }).then(handle),

  // To'lovlar tarixi
  my: () =>
    fetch(`${BASE}/payments/my`, { headers: headers() }).then(handle),

  // Operator karta ma'lumotlari
  info: () =>
    fetch(`${BASE}/payments/info`, { headers: headers() }).then(handle),
};
