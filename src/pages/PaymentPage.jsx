import { useState, useEffect, useCallback } from "react";
import { C } from "../constants";
import { paymentsAPI, offersAPI } from "../services/api";

// ── Karta raqamini formatlash ─────────────────────────────────────
const fmtCard = (n = "") => n.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();

// ── Sana formatlash ──────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("uz-UZ", { dateStyle: "medium", timeStyle: "short" }) : "—";

// ── Narx formatlash ──────────────────────────────────────────────
const fmtPrice = (n) => Number(n).toLocaleString("uz-UZ") + " so'm";

// ── Status badge ─────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const cfg = {
    pending:   { bg: "#FFF3CD", color: "#856404", label: "Kutilmoqda" },
    confirmed: { bg: "#D1E7DD", color: "#0A3622", label: "Tasdiqlangan" },
    paid:      { bg: "#D1E7DD", color: "#0A3622", label: "To'langan"   },
    cancelled: { bg: "#F8D7DA", color: "#842029", label: "Bekor"        },
  }[status] || { bg: "#eee", color: "#444", label: status };

  return (
    <span style={{
      background: cfg.bg, color: cfg.color, borderRadius: 20,
      padding: "3px 10px", fontSize: 11, fontWeight: 700,
    }}>
      {cfg.label}
    </span>
  );
};

export default function PaymentPage({ user }) {
  const [tab, setTab]           = useState("pending"); // pending | history
  const [sentOffers, setSent]   = useState([]);
  const [recvOffers, setRecv]   = useState([]);
  const [history,    setHist]   = useState([]);
  const [opCard,     setOpCard] = useState({ card: "...", name: "..." });
  const [loading,    setLoading]= useState(true);
  const [modal,      setModal]  = useState(null); // { offer } yoki null
  const [cardFrom,   setCardFrom] = useState("");
  const [note,       setNote]   = useState("");
  const [submitting, setSub]    = useState(false);
  const [toast,      setToast]  = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sent, recv, hist, info] = await Promise.all([
        offersAPI.getSent(),
        offersAPI.getReceived(),
        paymentsAPI.my(),
        paymentsAPI.info(),
      ]);
      setSent(sent.filter(o => o.status !== "paid"));
      setRecv(recv);
      setHist(hist);
      setOpCard(info);
    } catch {/* silent */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── To'lovni tasdiqlash (seller) ─────────────────────────────────
  const confirmPayment = async (offerId) => {
    try {
      await paymentsAPI.confirm(offerId);
      showToast("To'lov tasdiqlandi ✅");
      await load();
    } catch (e) {
      showToast(e.message, false);
    }
  };

  // ── To'lovni yuborish (buyer modal) ──────────────────────────────
  const submitPayment = async () => {
    if (!modal) return;
    setSub(true);
    try {
      await paymentsAPI.send({ offerId: modal.id, cardFrom, note });
      showToast("To'lov ma'lumotlari yuborildi ✅");
      setModal(null);
      setCardFrom(""); setNote("");
      await load();
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setSub(false);
    }
  };

  // ── Copy to clipboard ────────────────────────────────────────────
  const copy = (text) => {
    navigator.clipboard.writeText(text.replace(/\s/g, ""));
    showToast("Nusxalandi!");
  };

  // ── Pending to'lovlar (buyer ko'radi) ────────────────────────────
  const pendingOffers = sentOffers.filter(o => o.status === "pending");
  // ── Tasdiqlash kutilayotgan (seller ko'radi) ─────────────────────
  const toConfirm = recvOffers.filter(o => o.status === "pending");

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 430, margin: "0 auto", paddingBottom: 90 }}>
      {/* ── Sarlavha ─────────────────────────────────────────────── */}
      <div style={{
        padding: "14px 16px 12px", background: C.card,
        borderBottom: `1px solid ${C.border}`, marginBottom: 0,
      }}>
        <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>💳 To'lovlar</div>
      </div>

      {/* ── Operator karta qutisi ─────────────────────────────────── */}
      <div style={{
        margin: "16px 16px 0", borderRadius: 18,
        background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})`,
        padding: "18px 20px", color: "#fff", boxShadow: C.shadowMd,
      }}>
        <div style={{ fontSize: 11, opacity: 0.85, marginBottom: 4 }}>Operator karta</div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: 2, marginBottom: 6 }}>
          {fmtCard(opCard.card)}
        </div>
        <div style={{ fontSize: 13, opacity: 0.9, marginBottom: 14 }}>{opCard.name}</div>
        <button onClick={() => copy(opCard.card)} style={{
          background: "rgba(255,255,255,0.25)", border: "none", borderRadius: 10,
          color: "#fff", padding: "7px 16px", fontSize: 12, fontWeight: 700,
          cursor: "pointer",
        }}>
          📋 Nusxalash
        </button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", margin: "16px 16px 0",
        background: C.primaryLight, borderRadius: 12, padding: 4,
      }}>
        {[["pending", "Kutilayotgan"], ["history", "Tarix"]].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            flex: 1, border: "none", borderRadius: 10, cursor: "pointer",
            padding: "8px 0", fontSize: 13, fontWeight: tab === k ? 800 : 500,
            background: tab === k ? C.primaryDark : "transparent",
            color: tab === k ? "#fff" : C.textSub, transition: "all .2s",
          }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Kutilayotgan tab ─────────────────────────────────────── */}
      {tab === "pending" && (
        <div style={{ padding: "12px 16px 0" }}>

          {/* Buyer: to'lov yuborish kerak bo'lgan offerlar */}
          {pendingOffers.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSub, marginBottom: 8 }}>
                💸 To'lash kerak
              </div>
              {pendingOffers.map(o => (
                <div key={o.id} style={{
                  background: C.card, borderRadius: 14, padding: "14px 16px",
                  marginBottom: 10, boxShadow: C.shadow, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.text }}>
                      {o.productName}
                    </div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ fontSize: 13, color: C.textSub, marginBottom: 4 }}>
                    Narx: <b style={{ color: C.primaryDark }}>{fmtPrice(o.productPrice)}</b>
                  </div>
                  {o.sellerName && (
                    <div style={{ fontSize: 12, color: C.textMuted }}>Sotuvchi: {o.sellerName}</div>
                  )}
                  <button
                    onClick={() => { setModal(o); setCardFrom(""); setNote(""); }}
                    style={{
                      marginTop: 10, width: "100%", background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      border: "none", borderRadius: 10, color: "#fff", fontWeight: 700,
                      padding: "9px 0", cursor: "pointer", fontSize: 13,
                    }}
                  >
                    💳 To'lovni tasdiqlash
                  </button>
                </div>
              ))}
            </>
          )}

          {/* Seller: tasdiqlanmagan to'lovlar */}
          {toConfirm.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.textSub, marginBottom: 8, marginTop: 12 }}>
                ✅ Tasdiqlash kerak
              </div>
              {toConfirm.map(o => (
                <div key={o.id} style={{
                  background: C.card, borderRadius: 14, padding: "14px 16px",
                  marginBottom: 10, boxShadow: C.shadow, border: `1px solid ${C.border}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{o.productName}</div>
                    <StatusBadge status={o.status} />
                  </div>
                  <div style={{ fontSize: 13, color: C.textSub, marginBottom: 2 }}>
                    Xaridor: <b>{o.buyerName}</b>
                  </div>
                  <div style={{ fontSize: 13, color: C.textSub, marginBottom: 4 }}>
                    Tel: {o.buyerPhone}
                    {o.buyerTelegram ? ` | ${o.buyerTelegram}` : ""}
                  </div>
                  <div style={{ fontSize: 13, color: C.primaryDark, fontWeight: 700 }}>
                    {fmtPrice(o.productPrice)}
                  </div>
                  <button
                    onClick={() => confirmPayment(o.id)}
                    style={{
                      marginTop: 10, width: "100%",
                      background: "linear-gradient(135deg,#28A869,#1e7e50)",
                      border: "none", borderRadius: 10, color: "#fff",
                      fontWeight: 700, padding: "9px 0", cursor: "pointer", fontSize: 13,
                    }}
                  >
                    ✅ To'lovni tasdiqlash
                  </button>
                </div>
              ))}
            </>
          )}

          {pendingOffers.length === 0 && toConfirm.length === 0 && (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              color: C.textMuted, fontSize: 14,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💳</div>
              Kutilayotgan to'lovlar yo'q
            </div>
          )}
        </div>
      )}

      {/* ── Tarix tab ────────────────────────────────────────────── */}
      {tab === "history" && (
        <div style={{ padding: "12px 16px 0" }}>
          {history.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "40px 20px",
              color: C.textMuted, fontSize: 14,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              To'lovlar tarixi bo'sh
            </div>
          ) : (
            history.map(p => (
              <div key={p.id} style={{
                background: C.card, borderRadius: 14, padding: "14px 16px",
                marginBottom: 10, boxShadow: C.shadow, border: `1px solid ${C.border}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: C.text }}>
                    #{p.id} — {fmtPrice(p.amount)}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                {p.card_from && (
                  <div style={{ fontSize: 12, color: C.textSub }}>
                    Kartadan: {fmtCard(p.card_from)}
                  </div>
                )}
                <div style={{ fontSize: 12, color: C.textSub }}>
                  Kartaga: {fmtCard(p.card_to)}
                </div>
                {p.note && (
                  <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>
                    Izoh: {p.note}
                  </div>
                )}
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                  {fmtDate(p.created_at)}
                  {p.confirmed_at && ` · Tasdiqlandi: ${fmtDate(p.confirmed_at)}`}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── To'lov modal ─────────────────────────────────────────── */}
      {modal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
          zIndex: 100, padding: "0 0 0 0",
        }}
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div style={{
            background: C.card, borderRadius: "22px 22px 0 0",
            width: "100%", maxWidth: 430, padding: "20px 20px 36px",
            boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
          }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 14px" }} />
              <div style={{ fontSize: 17, fontWeight: 900, color: C.text }}>To'lovni tasdiqlash</div>
              <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>
                {modal.productName} — <b style={{ color: C.primaryDark }}>{fmtPrice(modal.productPrice)}</b>
              </div>
            </div>

            {/* Operator karta */}
            <div style={{
              background: C.primaryLight, borderRadius: 14,
              padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.primaryBorder}`,
            }}>
              <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>Quyidagi kartaga o'tkazing:</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: C.primaryDark, letterSpacing: 1 }}>
                {fmtCard(opCard.card)}
              </div>
              <div style={{ fontSize: 12, color: C.textSub }}>{opCard.name}</div>
              <button onClick={() => copy(opCard.card)} style={{
                marginTop: 8, background: C.primaryDark, border: "none",
                borderRadius: 8, color: "#fff", padding: "6px 14px",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                📋 Nusxalash
              </button>
            </div>

            {/* Karta ma'lumotlari */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: C.textSub, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Sizning karta raqamingiz (ixtiyoriy)
              </label>
              <input
                value={cardFrom}
                onChange={e => setCardFrom(e.target.value)}
                placeholder="8600 0000 0000 0000"
                maxLength={19}
                style={{
                  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`,
                  borderRadius: 12, padding: "10px 14px", fontSize: 14, outline: "none",
                  fontFamily: "monospace",
                }}
              />
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 12, color: C.textSub, fontWeight: 700, display: "block", marginBottom: 6 }}>
                Izoh (ixtiyoriy)
              </label>
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="To'lov haqida qo'shimcha ma'lumot..."
                rows={2}
                style={{
                  width: "100%", boxSizing: "border-box", border: `1.5px solid ${C.border}`,
                  borderRadius: 12, padding: "10px 14px", fontSize: 13,
                  resize: "none", outline: "none",
                }}
              />
            </div>

            <button
              onClick={submitPayment}
              disabled={submitting}
              style={{
                width: "100%", padding: "13px 0", borderRadius: 14, border: "none",
                background: submitting ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                color: "#fff", fontWeight: 800, fontSize: 15, cursor: submitting ? "default" : "pointer",
                boxShadow: `0 4px 14px rgba(244,137,74,0.4)`,
              }}
            >
              {submitting ? "Saqlanmoqda..." : "✅ To'lov yuborildi"}
            </button>

            <button
              onClick={() => setModal(null)}
              style={{
                width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 14,
                border: `1.5px solid ${C.border}`, background: "transparent",
                color: C.textSub, fontWeight: 700, fontSize: 14, cursor: "pointer",
              }}
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {/* ── Toast ───────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
          background: toast.ok ? "#1e7e50" : C.danger, color: "#fff",
          borderRadius: 12, padding: "10px 20px", fontSize: 13, fontWeight: 700,
          zIndex: 200, boxShadow: C.shadowMd, whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
