import { useState } from "react";
import { BtnPrimary, BtnGhost, Lbl, TInput } from "../components/UI";
import { C } from "../constants";
import { authAPI, setToken } from "../services/api";

// ─── LOGIN / REGISTER PAGE (Demo: ixtiyoriy 4 xonali kod) ────────
export default function LoginPage({ onLogin }) {
  const [mode,     setMode]     = useState("login");   // "login" | "register"
  const [phone,    setPhone]    = useState("");
  const [name,     setName]     = useState("");
  const [telegram, setTelegram] = useState("");
  const [code,     setCode]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const switchMode = (m) => { setMode(m); setError(""); setCode(""); };

  const handleSubmit = async () => {
    setError("");

    if (!phone.trim()) { setError("Telefon raqam kiriting"); return; }
    if (mode === "register" && !name.trim()) { setError("Ism familiya kiriting"); return; }
    if (!code.trim() || code.trim().length < 4) {
      setError("Kamida 4 xonali kod kiriting"); return;
    }

    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await authAPI.login({ phone: phone.trim(), code: code.trim() });
      } else {
        data = await authAPI.register({
          name:     name.trim(),
          phone:    phone.trim(),
          code:     code.trim(),
          telegram: telegram.trim(),
        });
      }
      setToken(data.token);
      localStorage.setItem("rm_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      // Login da "topilmadi" xatosi → ro'yxatdan o'tishga yo'naltirish
      if (mode === "login" && e.message?.includes("topilmadi")) {
        setError("Bu raqam topilmadi. \"Ro'yxatdan o'tish\" ni tanlang.");
      } else {
        setError(e.message || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily: "'Nunito','Segoe UI',sans-serif",
      background: C.bg,
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 28px",
    }}>

      {/* Logo */}
      <div style={{
        width: 80, height: 80, borderRadius: 24, marginBottom: 16,
        background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
      }}>♻️</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 4 }}>
        ReMarket
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 32, textAlign: "center" }}>
        Qayta ishlangan qurilish materiallari bozori
      </div>

      {/* Card */}
      <div style={{
        width: "100%",
        background: C.card,
        borderRadius: 22,
        border: `1px solid ${C.border}`,
        padding: "24px 20px",
        boxShadow: "0 4px 22px rgba(0,0,0,0.08)",
      }}>

        {/* Mode tabs */}
        <div style={{
          display: "flex", background: C.bg, borderRadius: 14,
          padding: 4, marginBottom: 22, gap: 4,
        }}>
          {[["login", "Kirish"], ["register", "Ro'yxatdan o'tish"]].map(([m, lbl]) => (
            <button key={m} onClick={() => switchMode(m)} style={{
              flex: 1, padding: "9px 0", borderRadius: 11, border: "none",
              cursor: "pointer", fontFamily: "inherit", fontSize: 12,
              fontWeight: 700, transition: "all .2s",
              background: mode === m ? C.primaryDark : "transparent",
              color:      mode === m ? "white" : C.textMuted,
            }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Ism (faqat register) */}
        {mode === "register" && (
          <>
            <Lbl>Ism Familiya *</Lbl>
            <TInput value={name} onChange={setName} placeholder="Abdulloh Karimov" />
          </>
        )}

        {/* Telefon */}
        <Lbl>Telefon raqam *</Lbl>
        <TInput value={phone} onChange={setPhone} placeholder="+998 90 000 00 00" />

        {/* Telegram (ixtiyoriy, faqat register) */}
        {mode === "register" && (
          <>
            <Lbl>Telegram (ixtiyoriy)</Lbl>
            <TInput value={telegram} onChange={setTelegram} placeholder="@username" />
          </>
        )}

        {/* Demo kod */}
        <Lbl>Demo kod *</Lbl>
        <input
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="1234"
          inputMode="numeric"
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "14px", borderRadius: 14, marginBottom: 6,
            border: `2px solid ${C.primaryBorder}`,
            background: C.bg, fontSize: 28, fontWeight: 900,
            letterSpacing: 10, textAlign: "center", color: C.text,
            outline: "none", fontFamily: "inherit",
          }}
          onFocus={e => e.target.style.borderColor = C.primaryDark}
          onBlur={e  => e.target.style.borderColor = C.primaryBorder}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />

        {/* Demo izoh */}
        <div style={{
          background: C.primaryLight,
          border: `1px solid ${C.primaryBorder}`,
          borderRadius: 10, padding: "8px 12px",
          marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🧪</span>
          <span style={{ fontSize: 11, color: C.primaryDark, fontWeight: 600 }}>
            Demo rejim: ixtiyoriy 4 xonali son kiriting (masalan: 1234)
          </span>
        </div>

        {error && <ErrorBox msg={error} />}

        <BtnPrimary onClick={handleSubmit} fullWidth>
          {loading
            ? "⏳ Yuklanmoqda..."
            : mode === "login" ? "🔑 Kirish" : "✅ Ro'yxatdan o'tish"}
        </BtnPrimary>

        {/* Mode switch */}
        <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textMuted }}>
          {mode === "login" ? (
            <>Hisobingiz yo'qmi?{" "}
              <span onClick={() => switchMode("register")}
                style={{ color: C.primaryDark, fontWeight: 700, cursor: "pointer" }}>
                Ro'yxatdan o'ting
              </span>
            </>
          ) : (
            <>Hisobingiz bormi?{" "}
              <span onClick={() => switchMode("login")}
                style={{ color: C.primaryDark, fontWeight: 700, cursor: "pointer" }}>
                Kiring
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 10, marginBottom: 12,
      background: "#FFF1F0", color: "#FF4D4F",
      fontSize: 12, fontWeight: 600,
    }}>
      ⚠️ {msg}
    </div>
  );
}
