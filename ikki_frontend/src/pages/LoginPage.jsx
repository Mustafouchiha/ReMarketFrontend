import { useState } from "react";
import { BtnPrimary, BtnGhost, Lbl, TInput } from "../components/UI";
import { C } from "../constants";
import { authAPI, setToken } from "../services/api";

// ─── LOGIN / REGISTER PAGE ────────────────────────────────────────
export default function LoginPage({ onLogin }) {
  const [mode,     setMode]     = useState("login");   // "login" | "register"
  const [step,     setStep]     = useState(1);         // 1=telefon, 2=kod
  const [phone,    setPhone]    = useState("");
  const [name,     setName]     = useState("");
  const [telegram, setTelegram] = useState("");
  const [code,     setCode]     = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [timer,    setTimer]    = useState(0);         // qayta yuborish hisoblagichi

  // ── Qayta yuborish countdown ──────────────────────────────────
  const startTimer = () => {
    setTimer(60);
    const iv = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  // ── 1-qadam: Kod yuborish ─────────────────────────────────────
  const handleSendCode = async () => {
    if (!phone.trim()) { setError("Telefon raqam kiriting"); return; }
    if (mode === "register" && !name.trim()) { setError("Ism familiya kiriting"); return; }
    setLoading(true); setError("");
    try {
      await authAPI.sendCode(phone.trim());
      setStep(2);
      startTimer();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 2-qadam: Kodni tasdiqlash ─────────────────────────────────
  const handleVerify = async () => {
    if (!code.trim()) { setError("Kodni kiriting"); return; }
    setLoading(true); setError("");
    try {
      let data;
      if (mode === "login") {
        data = await authAPI.login({ phone: phone.trim(), code: code.trim() });
      } else {
        data = await authAPI.register({
          name: name.trim(),
          phone: phone.trim(),
          code: code.trim(),
          telegram: telegram.trim(),
        });
      }
      setToken(data.token);
      localStorage.setItem("rm_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (m) => { setMode(m); setStep(1); setError(""); setCode(""); };

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
                  minHeight:"100vh", maxWidth:430, margin:"0 auto",
                  display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", padding:"40px 28px" }}>

      {/* Logo */}
      <div style={{ width:80, height:80, borderRadius:24, marginBottom:16,
                    background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:38 }}>♻️</div>
      <div style={{ fontSize:28, fontWeight:900, color:C.text, marginBottom:4 }}>ReMarket</div>
      <div style={{ fontSize:13, color:C.textMuted, marginBottom:32, textAlign:"center" }}>
        Qayta ishlangan qurilish materiallari bozori
      </div>

      {/* Card */}
      <div style={{ width:"100%", background:C.card, borderRadius:22,
                    border:`1px solid ${C.border}`, padding:"24px 20px",
                    boxShadow:"0 4px 22px rgba(0,0,0,0.08)" }}>

        {/* Mode tabs */}
        <div style={{ display:"flex", background:C.bg, borderRadius:14,
                      padding:4, marginBottom:22, gap:4 }}>
          {[["login","Kirish"],["register","Ro'yxatdan o'tish"]].map(([m, lbl]) => (
            <button key={m} onClick={() => switchMode(m)}
              style={{ flex:1, padding:"9px 0", borderRadius:11, border:"none",
                       cursor:"pointer", fontFamily:"inherit", fontSize:12,
                       fontWeight:700, transition:"all .2s",
                       background: mode===m ? C.primaryDark : "transparent",
                       color:      mode===m ? "white" : C.textMuted }}>
              {lbl}
            </button>
          ))}
        </div>

        {/* ── STEP 1: Telefon raqam ── */}
        {step === 1 && (
          <>
            {mode === "register" && (
              <>
                <Lbl>Ism Familiya *</Lbl>
                <TInput value={name} onChange={setName} placeholder="Abdulloh Karimov" />
              </>
            )}

            <Lbl>Telefon raqam *</Lbl>
            <TInput value={phone} onChange={setPhone} placeholder="+998 90 000 00 00" />

            {mode === "register" && (
              <>
                <Lbl>Telegram (ixtiyoriy)</Lbl>
                <TInput value={telegram} onChange={setTelegram} placeholder="@username" />
              </>
            )}

            {error && <ErrorBox msg={error} />}

            <BtnPrimary onClick={handleSendCode} fullWidth>
              {loading ? "⏳ Yuborilmoqda..." : "📲 Kod olish"}
            </BtnPrimary>
          </>
        )}

        {/* ── STEP 2: Tasdiqlash kodi ── */}
        {step === 2 && (
          <>
            {/* Qaysi raqamga yuborildi */}
            <div style={{ background:C.primaryLight, borderRadius:14, padding:"12px 14px",
                          marginBottom:18, border:`1px solid ${C.primaryBorder}`,
                          display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ fontSize:24 }}>📱</div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:C.primaryDark }}>Kod yuborildi</div>
                <div style={{ fontSize:11, color:C.textSub }}>{phone} raqamiga 6 xonali kod</div>
                <div style={{ fontSize:10, color:C.textMuted, marginTop:2 }}>
                  Hozircha: backend <b>console</b> da ko'ring
                </div>
              </div>
            </div>

            <Lbl>Tasdiqlash kodi *</Lbl>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              inputMode="numeric"
              style={{ width:"100%", boxSizing:"border-box",
                       padding:"14px", borderRadius:14, marginBottom:14,
                       border:`2px solid ${C.primaryBorder}`,
                       background:C.bg, fontSize:24, fontWeight:900,
                       letterSpacing:8, textAlign:"center", color:C.text,
                       outline:"none", fontFamily:"inherit" }}
              onFocus={e => e.target.style.borderColor = C.primaryDark}
              onBlur={e  => e.target.style.borderColor = C.primaryBorder}
            />

            {error && <ErrorBox msg={error} />}

            <BtnPrimary onClick={handleVerify} fullWidth>
              {loading ? "⏳ Tekshirilmoqda..." : "✅ Tasdiqlash"}
            </BtnPrimary>

            {/* Qayta yuborish */}
            <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.textMuted }}>
              {timer > 0 ? (
                <>Qayta yuborish: <b style={{ color:C.primaryDark }}>{timer}s</b></>
              ) : (
                <span onClick={handleSendCode}
                  style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  🔄 Kodni qayta yuborish
                </span>
              )}
            </div>

            <div style={{ textAlign:"center", marginTop:10 }}>
              <BtnGhost onClick={() => { setStep(1); setCode(""); setError(""); }}>
                ← Orqaga
              </BtnGhost>
            </div>
          </>
        )}

        {/* Mode switch link */}
        {step === 1 && (
          <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.textMuted }}>
            {mode === "login" ? (
              <>Hisobingiz yo'qmi?{" "}
                <span onClick={() => switchMode("register")}
                  style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  Ro'yxatdan o'ting
                </span>
              </>
            ) : (
              <>Hisobingiz bormi?{" "}
                <span onClick={() => switchMode("login")}
                  style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  Kiring
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Error box ────────────────────────────────────────────────────
function ErrorBox({ msg }) {
  return (
    <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:12,
                  background:"#FFF1F0", color:"#FF4D4F",
                  fontSize:12, fontWeight:600 }}>
      ⚠️ {msg}
    </div>
  );
}
