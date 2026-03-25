// ReMarket — Express backend (JSON fayl DB)
// Ishga tushirish: node server.cjs  yoki  nodemon server.cjs
const express    = require("express");
const cors       = require("cors");
const fs         = require("fs");
const path       = require("path");
const { randomUUID } = require("crypto");
const jwt        = require("jsonwebtoken");

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));

const DB_FILE    = path.join(__dirname, "db.json");
const JWT_SECRET = process.env.JWT_SECRET || "remarket-demo-secret-2024";
const PORT       = process.env.API_PORT || 5000;

// ─── JSON DB yordamchilari ────────────────────────────────────────
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
  } catch {
    return { users: [], products: [], offers: [], payments: [] };
  }
}
function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

// ─── Auth middleware ──────────────────────────────────────────────
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith("Bearer "))
    return res.status(401).json({ message: "Token topilmadi" });
  try {
    const { id } = jwt.verify(h.slice(7), JWT_SECRET);
    const db = readDB();
    req.user = db.users.find((u) => u.id === id);
    if (!req.user)
      return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    next();
  } catch {
    res.status(401).json({ message: "Token yaroqsiz" });
  }
}

const makeToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: "30d" });

const fmtUser = (u) => ({
  id:       u.id,
  name:     u.name,
  phone:    u.phone,
  telegram: u.telegram || "",
  avatar:   u.avatar   || null,
  balance:  Number(u.balance || 0),
  joined:   u.joined,
});

// ─── AUTH ─────────────────────────────────────────────────────────

// POST /api/auth/send-code  (demo: always ok, no real SMS)
app.post("/api/auth/send-code", (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ message: "Telefon majburiy" });
  res.json({ message: "Demo rejim — kod talab qilinmaydi", phone, otpRequired: false });
});

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, phone, code, telegram } = req.body;
  if (!name || !phone)
    return res.status(400).json({ message: "Ism va telefon majburiy" });
  if (!code || String(code).trim().length < 4)
    return res.status(400).json({ message: "Kamida 4 xonali kod kiriting" });

  const db = readDB();
  // Agar raqam bazada bo'lsa — login
  let user = db.users.find((u) => u.phone === phone);
  if (!user) {
    user = {
      id:       randomUUID(),
      name,
      phone,
      telegram: telegram || "",
      avatar:   null,
      balance:  0,
      joined:   new Date().toISOString(),
    };
    db.users.push(user);
    saveDB(db);
    console.log(`✅ Yangi foydalanuvchi: ${name} (${phone})`);
  } else {
    console.log(`🔄 Mavjud foydalanuvchi login: ${user.name} (${phone})`);
  }

  res.status(201).json({ token: makeToken(user.id), user: fmtUser(user) });
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { phone, code } = req.body;
  if (!phone) return res.status(400).json({ message: "Telefon majburiy" });
  if (!code || String(code).trim().length < 4)
    return res.status(400).json({ message: "Kamida 4 xonali kod kiriting" });

  const db = readDB();
  const user = db.users.find((u) => u.phone === phone);
  if (!user)
    return res.status(404).json({ message: "Bu raqam topilmadi. Ro'yxatdan o'ting" });

  console.log(`🔑 Login: ${user.name} (${phone})`);
  res.json({ token: makeToken(user.id), user: fmtUser(user) });
});

// GET /api/auth/me
app.get("/api/auth/me", auth, (req, res) => res.json(fmtUser(req.user)));

// PUT /api/auth/me
app.put("/api/auth/me", auth, (req, res) => {
  const db = readDB();
  const u = db.users.find((u) => u.id === req.user.id);
  const { name, phone, telegram, avatar } = req.body;
  if (name     !== undefined) u.name     = name;
  if (phone    !== undefined) u.phone    = phone;
  if (telegram !== undefined) u.telegram = telegram;
  if (avatar   !== undefined) u.avatar   = avatar;
  saveDB(db);
  res.json(fmtUser(u));
});

// ─── PRODUCTS ─────────────────────────────────────────────────────
const fmtProduct = (p, db) => {
  const owner = db.users.find((u) => u.id === p.owner_id);
  return { ...p, owner: owner ? fmtUser(owner) : null };
};

// GET /api/products  (barcha aktiv mahsulotlar, o'zinikisiz)
app.get("/api/products", (req, res) => {
  const db = readDB();
  const { category, viloyat, search } = req.query;

  // Auth ixtiyoriy
  let userId = null;
  try {
    const h = req.headers.authorization;
    if (h?.startsWith("Bearer ")) {
      const { id } = jwt.verify(h.slice(7), JWT_SECRET);
      userId = id;
    }
  } catch {}

  let list = (db.products || []).filter((p) => p.is_active !== false);
  if (userId)   list = list.filter((p) => p.owner_id !== userId);
  if (category) list = list.filter((p) => p.category === category);
  if (viloyat)  list = list.filter((p) => p.viloyat  === viloyat);
  if (search)   list = list.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  res.json(list.map((p) => fmtProduct(p, db)).reverse());
});

// GET /api/products/my
app.get("/api/products/my", auth, (req, res) => {
  const db = readDB();
  const list = (db.products || []).filter((p) => p.owner_id === req.user.id);
  res.json(list.map((p) => fmtProduct(p, db)).reverse());
});

// POST /api/products
app.post("/api/products", auth, (req, res) => {
  const { name, category, price, unit, qty, condition, viloyat, tuman, photo } = req.body;
  if (!name || !price || !viloyat)
    return res.status(400).json({ message: "Nomi, narxi va viloyat majburiy" });

  const db = readDB();
  const product = {
    id:         randomUUID(),
    name,
    category:   category  || "boshqa",
    price:      Number(price),
    unit:       unit      || "dona",
    qty:        Number(qty) || 1,
    condition:  condition || "Yaxshi",
    viloyat,
    tuman:      tuman     || "",
    photo:      photo     || null,
    owner_id:   req.user.id,
    is_active:  true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!db.products) db.products = [];
  db.products.push(product);
  saveDB(db);
  console.log(`📦 Mahsulot qo'shildi: ${name}`);
  res.status(201).json(fmtProduct(product, db));
});

// PUT /api/products/:id
app.put("/api/products/:id", auth, (req, res) => {
  const db = readDB();
  const p = (db.products || []).find((p) => p.id === req.params.id);
  if (!p) return res.status(404).json({ message: "Mahsulot topilmadi" });
  if (p.owner_id !== req.user.id)
    return res.status(403).json({ message: "Ruxsat yo'q" });

  const fields = ["name","category","unit","condition","viloyat","tuman","photo","is_active"];
  const numFields = ["price","qty"];
  for (const f of fields)    if (req.body[f] !== undefined) p[f] = req.body[f];
  for (const f of numFields) if (req.body[f] !== undefined) p[f] = Number(req.body[f]);
  p.updated_at = new Date().toISOString();
  saveDB(db);
  res.json(fmtProduct(p, db));
});

// DELETE /api/products/:id
app.delete("/api/products/:id", auth, (req, res) => {
  const db = readDB();
  const idx = (db.products || []).findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Mahsulot topilmadi" });
  if (db.products[idx].owner_id !== req.user.id)
    return res.status(403).json({ message: "Ruxsat yo'q" });
  db.products.splice(idx, 1);
  saveDB(db);
  res.json({ message: "Mahsulot o'chirildi" });
});

// ─── OFFERS ───────────────────────────────────────────────────────
const fmtOffer = (o, db) => {
  const product = (db.products || []).find((p) => p.id === o.product_id);
  const buyer   = db.users.find((u) => u.id === o.buyer_id);
  const seller  = db.users.find((u) => u.id === o.seller_id);
  return {
    ...o,
    product: product ? fmtProduct(product, db) : null,
    buyer:   buyer   ? fmtUser(buyer)   : null,
    seller:  seller  ? fmtUser(seller)  : null,
  };
};

// POST /api/offers
app.post("/api/offers", auth, (req, res) => {
  const { productId, message } = req.body;
  if (!productId) return res.status(400).json({ message: "productId majburiy" });

  const db = readDB();
  const product = (db.products || []).find((p) => p.id === productId);
  if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });
  if (product.owner_id === req.user.id)
    return res.status(400).json({ message: "O'z mahsulotingizga taklif yubormaydiz" });

  const offer = {
    id:            randomUUID(),
    product_id:    productId,
    buyer_id:      req.user.id,
    seller_id:     product.owner_id,
    product_price: product.price,
    status:        "pending",
    message:       message || "",
    created_at:    new Date().toISOString(),
    updated_at:    new Date().toISOString(),
  };
  if (!db.offers) db.offers = [];
  db.offers.push(offer);
  saveDB(db);
  res.status(201).json(fmtOffer(offer, db));
});

// GET /api/offers  (received — sotuvchi sifatida)
app.get("/api/offers", auth, (req, res) => {
  const db = readDB();
  const list = (db.offers || []).filter((o) => o.seller_id === req.user.id);
  res.json(list.map((o) => fmtOffer(o, db)).reverse());
});

// GET /api/offers/sent  (xaridor sifatida)
app.get("/api/offers/sent", auth, (req, res) => {
  const db = readDB();
  const list = (db.offers || []).filter((o) => o.buyer_id === req.user.id);
  res.json(list.map((o) => fmtOffer(o, db)).reverse());
});

// PUT /api/offers/:id/paid
app.put("/api/offers/:id/paid", auth, (req, res) => {
  const db = readDB();
  const offer = (db.offers || []).find((o) => o.id === req.params.id);
  if (!offer) return res.status(404).json({ message: "Taklif topilmadi" });
  if (offer.seller_id !== req.user.id)
    return res.status(403).json({ message: "Faqat sotuvchi tasdiqlashi mumkin" });
  offer.status     = "paid";
  offer.updated_at = new Date().toISOString();
  saveDB(db);
  res.json(fmtOffer(offer, db));
});

// ─── PAYMENTS ─────────────────────────────────────────────────────

// GET /api/payments/info
app.get("/api/payments/info", auth, (_req, res) => {
  res.json({ card: "8600 0000 0000 0000", name: "ReMarket Operator" });
});

// POST /api/payments
app.post("/api/payments", auth, (req, res) => {
  const { offerId, cardFrom, note } = req.body;
  if (!offerId) return res.status(400).json({ message: "offerId majburiy" });

  const db = readDB();
  const offer = (db.offers || []).find((o) => o.id === offerId);
  if (!offer) return res.status(404).json({ message: "Taklif topilmadi" });
  if (offer.buyer_id !== req.user.id)
    return res.status(403).json({ message: "Bu taklif sizniki emas" });

  if (!db.payments) db.payments = [];
  let payment = db.payments.find((p) => p.offer_id === offerId);
  if (payment) {
    if (cardFrom) payment.card_from = cardFrom;
    if (note)     payment.note      = note;
  } else {
    payment = {
      id:          randomUUID(),
      offer_id:    offerId,
      buyer_id:    offer.buyer_id,
      seller_id:   offer.seller_id,
      product_id:  offer.product_id,
      amount:      offer.product_price,
      status:      "pending",
      card_from:   cardFrom || null,
      card_to:     "86000000000000000",
      note:        note     || null,
      created_at:  new Date().toISOString(),
      confirmed_at: null,
    };
    db.payments.push(payment);
  }
  saveDB(db);
  res.status(201).json({
    message: "To'lov ma'lumotlari saqlandi",
    payment,
    operatorCard: "8600 0000 0000 0000",
    operatorName: "ReMarket Operator",
  });
});

// PUT /api/payments/:offerId/confirm
app.put("/api/payments/:offerId/confirm", auth, (req, res) => {
  const db = readDB();
  const offer = (db.offers || []).find((o) => o.id === req.params.offerId);
  if (!offer) return res.status(404).json({ message: "Taklif topilmadi" });
  if (offer.seller_id !== req.user.id)
    return res.status(403).json({ message: "Faqat sotuvchi tasdiqlashi mumkin" });

  const payment = (db.payments || []).find((p) => p.offer_id === req.params.offerId);
  if (!payment) return res.status(404).json({ message: "To'lov topilmadi" });

  payment.status       = "confirmed";
  payment.confirmed_at = new Date().toISOString();
  offer.status         = "paid";
  offer.updated_at     = new Date().toISOString();
  saveDB(db);
  res.json({ message: "To'lov tasdiqlandi ✅", payment });
});

// GET /api/payments/my
app.get("/api/payments/my", auth, (req, res) => {
  const db = readDB();
  const list = (db.payments || []).filter(
    (p) => p.buyer_id === req.user.id || p.seller_id === req.user.id
  );
  res.json(list.reverse());
});

// ─── WALLET ───────────────────────────────────────────────────────

// GET /api/wallet/balance
app.get("/api/wallet/balance", auth, (req, res) => {
  res.json({ balance: Number(req.user.balance || 0) });
});

// POST /api/wallet/deposit
app.post("/api/wallet/deposit", auth, (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0)
    return res.status(400).json({ message: "amount musbat son bo'lishi kerak" });

  const db = readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  user.balance = (user.balance || 0) + amount;
  saveDB(db);
  console.log(`💰 Deposit: ${user.phone} +${amount} → balans: ${user.balance}`);
  res.json({ message: "Balans to'ldirildi", deposited: amount, wallet: fmtUser(user) });
});

// POST /api/wallet/pay
app.post("/api/wallet/pay", auth, (req, res) => {
  const amount      = Number(req.body.amount);
  const { description } = req.body;
  if (!amount || amount <= 0)
    return res.status(400).json({ message: "amount musbat son bo'lishi kerak" });

  const db = readDB();
  const user = db.users.find((u) => u.id === req.user.id);
  if ((user.balance || 0) < amount) {
    return res.status(400).json({
      message:  "Balansda yetarli mablag' yo'q",
      balance:  user.balance,
      required: amount,
      shortfall: amount - user.balance,
    });
  }
  user.balance -= amount;
  saveDB(db);
  console.log(`💸 Pay: ${user.phone} -${amount} → qoldi: ${user.balance}`);
  res.json({
    message:     "To'lov amalga oshirildi",
    paid:        amount,
    description: description || null,
    wallet:      fmtUser(user),
  });
});

// ─── Health check ─────────────────────────────────────────────────
app.get("/", (_req, res) => {
  const db  = readDB();
  res.json({
    status:    "ok",
    message:   "ReMarket API (JSON DB) ishlayapti ✅",
    database:  "db.json",
    users:     db.users.length,
    products:  (db.products  || []).length,
    offers:    (db.offers    || []).length,
    payments:  (db.payments  || []).length,
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 ──────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ message: "Bu yo'l topilmadi" }));

app.listen(PORT, () => {
  console.log(`\n🚀 ReMarket API → http://localhost:${PORT}`);
  console.log(`📁 DB fayl    → ${DB_FILE}\n`);
});
