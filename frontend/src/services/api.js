const PROD_API_FALLBACK = "https://requrilish.onrender.com";
const RAW_BASE = import.meta.env.VITE_API_URL
  || (import.meta.env.PROD ? PROD_API_FALLBACK : "");
const BASE = RAW_BASE
  ? `${RAW_BASE.replace(/\/+$/, "").replace(/\/api$/i, "")}/api`
  : "/api";

export const getToken  = ()  => localStorage.getItem("rm_token");
export const setToken  = (t) => localStorage.setItem("rm_token", t);
export const clearAuth = ()  => {
  localStorage.removeItem("rm_token");
  localStorage.removeItem("rm_user");
};

const headers = (extra = {}) => ({
  "Content-Type": "application/json",
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

const apiFetch = (url, opts, timeoutMs = 15000) => {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => {
      const e = new Error("SERVER_OFFLINE"); e.offline = true; reject(e);
    }, timeoutMs)
  );
  return Promise.race([fetch(url, opts), timeout])
    .catch((e) => {
      if (e.offline) throw e;
      const err = new Error("SERVER_OFFLINE"); err.offline = true; throw err;
    });
};

const handle = async (res) => {
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || "Xatolik yuz berdi");
    if (data.needBot) err.needBot = true;
    throw err;
  }
  return data;
};

// ─── PING (server warmup) ─────────────────────────────────────────
export const ping = () => fetch(`${BASE}/ping`).catch(() => {});

// ─── AUTH ─────────────────────────────────────────────────────────
export const authAPI = {
  sendCode: (body) =>
    apiFetch(`${BASE}/auth/send-code`, { method: "POST", headers: headers(), body: JSON.stringify(typeof body === "string" ? { phone: body } : body) }).then(handle),
  register: (body) =>
    apiFetch(`${BASE}/auth/register`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),
  login: (body) =>
    apiFetch(`${BASE}/auth/login`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),
  me: () =>
    apiFetch(`${BASE}/auth/me`, { headers: headers() }).then(handle),
  updateMe: (body) =>
    apiFetch(`${BASE}/auth/me`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handle),
  loginWithTgToken: (token) =>
    apiFetch(`${BASE}/auth/tg-token/${token}`, { headers: headers() }).then(handle),
  tgInit: (initData) =>
    apiFetch(`${BASE}/auth/tg-init`, { method: "POST", headers: headers(), body: JSON.stringify({ initData }) }).then(handle),
};

// ─── OPERATOR ─────────────────────────────────────────────────────
export const operatorAPI = {
  // Foydalanuvchilar
  getUsers: (q = "") =>
    apiFetch(`${BASE}/operator/users${q ? "?q=" + encodeURIComponent(q) : ""}`, { headers: headers() }).then(handle),
  deleteUser: (id) =>
    apiFetch(`${BASE}/operator/users/${id}`, { method: "DELETE", headers: headers() }).then(handle),
  blockUser: (id) =>
    apiFetch(`${BASE}/operator/users/${id}/block`, { method: "PUT", headers: headers() }).then(handle),
  unblockUser: (id) =>
    apiFetch(`${BASE}/operator/users/${id}/unblock`, { method: "PUT", headers: headers() }).then(handle),
  deposit: (phone, amount) =>
    apiFetch(`${BASE}/operator/deposit`, { method: "POST", headers: headers(), body: JSON.stringify({ phone, amount }) }).then(handle),

  // Postlar
  getPendingPosts: () =>
    apiFetch(`${BASE}/operator/pending-posts`, { headers: headers() }).then(handle),
  getProducts: (q = "", status = "") => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const qs = params.toString();
    return apiFetch(`${BASE}/operator/products${qs ? "?" + qs : ""}`, { headers: headers() }).then(handle);
  },
  approvePost: (id) =>
    apiFetch(`${BASE}/operator/posts/${id}/approve`, { method: "PUT", headers: headers() }).then(handle),
  rejectPost: (id, reason) =>
    apiFetch(`${BASE}/operator/posts/${id}/reject`, { method: "PUT", headers: headers(), body: JSON.stringify({ reason }) }).then(handle),
  hidePost: (id) =>
    apiFetch(`${BASE}/operator/posts/${id}/hide`, { method: "PUT", headers: headers() }).then(handle),
  showPost: (id) =>
    apiFetch(`${BASE}/operator/posts/${id}/show`, { method: "PUT", headers: headers() }).then(handle),
  deletePost: (id) =>
    apiFetch(`${BASE}/operator/posts/${id}`, { method: "DELETE", headers: headers() }).then(handle),

  // To'lovlar
  getPayments: () =>
    apiFetch(`${BASE}/operator/payments`, { headers: headers() }).then(handle),
  confirmPayment: (offerId) =>
    apiFetch(`${BASE}/operator/payments/${offerId}/confirm`, { method: "PUT", headers: headers() }).then(handle),

  // Statistika
  getStats: () =>
    apiFetch(`${BASE}/operator/stats`, { headers: headers() }).then(handle),

  getPendingOffers: () =>
    apiFetch(`${BASE}/operator/pending-offers`, { headers: headers() }).then(handle),
  manualConfirm: (offerId) =>
    apiFetch(`${BASE}/operator/manual-confirm/${offerId}`, { method: "POST", headers: headers() }).then(handle),

  withdraw: (phone, amount) =>
    apiFetch(`${BASE}/operator/withdraw`, { method: "POST", headers: headers(), body: JSON.stringify({ phone, amount }) }).then(handle),

  // Operator management
  getOperators: () =>
    apiFetch(`${BASE}/operator/operators`, { headers: headers() }).then(handle),
  addOperator: (identifier) =>
    apiFetch(`${BASE}/operator/operators`, { method: "POST", headers: headers(), body: JSON.stringify({ identifier }) }).then(handle),
  removeOperator: (id) =>
    apiFetch(`${BASE}/operator/operators/${id}`, { method: "DELETE", headers: headers() }).then(handle),

  // Legacy
  setUserBlocked: (id, blocked) =>
    blocked ? operatorAPI.blockUser(id) : operatorAPI.unblockUser(id),
  deleteProduct: (id) => operatorAPI.deletePost(id),
  setProductActive: (id, active) =>
    active ? operatorAPI.showPost(id) : operatorAPI.hidePost(id),
};

// ─── PRODUCTS ─────────────────────────────────────────────────────
export const productsAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v))
    ).toString();
    return apiFetch(`${BASE}/products${qs ? "?" + qs : ""}`, { headers: headers() }).then(handle);
  },
  getMy: () =>
    apiFetch(`${BASE}/products/my`, { headers: headers() }).then(handle),
  create: (body) =>
    apiFetch(`${BASE}/products`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),
  update: (id, body) =>
    apiFetch(`${BASE}/products/${id}`, { method: "PUT", headers: headers(), body: JSON.stringify(body) }).then(handle),
  remove: (id) =>
    apiFetch(`${BASE}/products/${id}`, { method: "DELETE", headers: headers() }).then(handle),
};

// ─── OFFERS ───────────────────────────────────────────────────────
export const offersAPI = {
  send: (productId, message = "") =>
    apiFetch(`${BASE}/offers`, { method: "POST", headers: headers(), body: JSON.stringify({ productId, message }) }).then(handle),
  getReceived: () =>
    apiFetch(`${BASE}/offers`, { headers: headers() }).then(handle),
  getSent: () =>
    apiFetch(`${BASE}/offers/sent`, { headers: headers() }).then(handle),
  markPaid: (id) =>
    apiFetch(`${BASE}/offers/${id}/paid`, { method: "PUT", headers: headers() }).then(handle),
};

// ─── PAYMENTS ─────────────────────────────────────────────────────
export const paymentsAPI = {
  send: (body) =>
    apiFetch(`${BASE}/payments`, { method: "POST", headers: headers(), body: JSON.stringify(body) }).then(handle),
  confirm: (offerId) =>
    apiFetch(`${BASE}/payments/${offerId}/confirm`, { method: "PUT", headers: headers() }).then(handle),
  balancePay: (offerId) =>
    apiFetch(`${BASE}/payments/balance-pay`, { method: "POST", headers: headers(), body: JSON.stringify({ offerId }) }).then(handle),
  my: () =>
    apiFetch(`${BASE}/payments/my`, { headers: headers() }).then(handle),
  info: () =>
    apiFetch(`${BASE}/payments/info`, { headers: headers() }).then(handle),
};
