import { useState } from "react";
import { BtnPrimary } from "../components/UI";
import { C } from "../constants";
import { authAPI, setToken } from "../services/api";
import Logo from "../components/Logo";
import { Smartphone, Loader2, KeyRound, AlertTriangle, ArrowLeft } from "lucide-react";

const BOT_URL = import.meta.env.VITE_TG_BOT_URL || "https://t.me/Requrilishbot";

// Mini App ichida Telegram link ochish (mini appni yopmaydi)
function openBot() {
  if (window.Telegram?.WebApp?.openTelegramLink) {
    window.Telegram.WebApp.openTelegramLink(BOT_URL);
  } else {
    window.open(BOT_URL, "_blank");
  }
}

function formatPhone(raw) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7)}`;
}

export default function LoginPage({ onLogin }) {
  const [step,    setStep]    = useState(1);
  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [info,    setInfo]    = useState("");

  // Telegram WebApp dan user ma'lumotlari
  const getTgInfo = () => {
    const u = window.Telegram?.WebApp?.initDataUnsafe?.user;
    return {
      tgChatId: u?.id ? String(u.id) : undefined,
      tgName:   u ? [u.first_name, u.last_name].filter(Boolean).join(" ") : "",
      tgHandle: u?.username ? `@${u.username}` : "",
    };
  };

  const withRetry = async (fn, retries = 6) => {
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (e) {
        if (e.offline && i < retries) {
          setError(`Ulanmoqda... (${i + 1})`);
          await new Promise(r => setTimeout(r, 4000));
          setError("");
          continue;
        }
        throw e;
      }
    }
  };

  const handleSendCode = async () => {
    setError(""); setInfo("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("9 xonali telefon raqam kiriting"); return; }
    setLoading(true);
    try {
      const { tgChatId, tgName, tgHandle } = getTgInfo();
      await withRetry(() => authAPI.sendCode({
        phone:    digits,
        tgChatId,
        name:     tgName || "Foydalanuvchi",
        telegram: tgHandle || undefined,
      }));
      setInfo("✅ Telegram ga 6 xonali kod yuborildi");
      setStep(2);
    } catch (e) {
      if (e.offline) {
        setError("Server vaqtincha ishlamayapti. Bir oz kuting va qayta urining.");
      } else if (e.needBot || (e.message || "").toLowerCase().includes("bot")) {
        setError("Avval @Requrilishbot ga /start yuboring, keyin qaytib keling.");
      } else {
        setError(e.message || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (code.trim().length !== 6) { setError("6 xonali kod kiriting"); return; }
    setLoading(true);
    try {
      const { tgChatId } = getTgInfo();
      const data = await withRetry(() => authAPI.login({
        phone: phone.replace(/\D/g, ""),
        code:  code.trim(),
        tgChatId,
      }));
      setToken(data.token);
      localStorage.setItem("rm_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.offline ? "Server javob bermadi. Qayta urinib ko'ring." : (e.message || "Xatolik yuz berdi"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
      minHeight:"100vh", maxWidth:430, margin:"0 auto",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"32px 20px",
    }}>
      {/* Logo */}
      <div style={{ marginBottom:12 }}><Logo size={72} /></div>
      <div style={{ fontSize:26, fontWeight:900, color:C.text, marginBottom:2 }}>ReQurilish</div>
      <div style={{ fontSize:12, color:C.textMuted, marginBottom:24, textAlign:"center" }}>
        Qurilish materiallari bozori
      </div>

      <div style={{ width:"100%", background:C.card, borderRadius:22,
                    border:`1px solid ${C.border}`, overflow:"hidden",
                    boxShadow:"0 4px 22px rgba(0,0,0,0.08)" }}>


        <div style={{ padding:"22px 20px" }}>

          {/* ── Step 1: Phone ── */}
          {step === 1 && (
            <>
              <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:5 }}>
                Telefon raqam *
              </div>
              <PhoneInput value={phone} onChange={setPhone} onEnter={handleSendCode} />

              {error && <ErrorBox msg={error} />}

              <BtnPrimary onClick={handleSendCode} fullWidth disabled={loading}>
                {loading
                  ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> {error ? "Qayta urinilmoqda..." : "Yuborilmoqda..."}</>
                  : <><Smartphone size={14} /> Telegram ga kod yuborish</>
                }
              </BtnPrimary>

              {/* Bot link — Mini App ichida to'g'ri ochiladi */}
              <div style={{ marginTop:16, padding:"11px 14px", borderRadius:13,
                            background:"#E8F6FD", border:"1px solid #BDE3F8",
                            display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:20 }}>💬</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:800, color:"#0088CC", marginBottom:2 }}>
                    Telegram bot orqali ham kirish mumkin
                  </div>
                  <button onClick={openBot} style={{
                    background:"none", border:"none", padding:0, cursor:"pointer",
                    fontSize:11, color:"#0088CC", fontFamily:"inherit", fontWeight:700,
                    textDecoration:"underline",
                  }}>
                    @Requrilishbot → /start
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <>
              <button onClick={() => { setStep(1); setCode(""); setError(""); setInfo(""); }}
                style={{ display:"flex", alignItems:"center", gap:5, background:"none",
                         border:"none", cursor:"pointer", color:C.textSub,
                         fontSize:12, fontWeight:700, marginBottom:18, padding:0, fontFamily:"inherit" }}>
                <ArrowLeft size={13} /> Orqaga
              </button>

              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:36, marginBottom:8 }}>📨</div>
                <div style={{ fontSize:17, fontWeight:900, color:C.text, marginBottom:4 }}>
                  Telegram kodingizni kiriting
                </div>
                <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>
                  @Requrilishbot dan 6 xonali kod yuborildi
                </div>
                <div style={{ marginTop:8, display:"inline-block",
                              background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                              borderRadius:10, padding:"4px 14px",
                              fontSize:14, fontWeight:900, color:C.primaryDark }}>
                  +998 {phone}
                </div>
              </div>

              {info && (
                <div style={{ marginBottom:12, padding:"9px 13px", borderRadius:10,
                              background:"#F0FFF4", color:"#22863a", fontSize:12, fontWeight:600 }}>
                  {info}
                </div>
              )}

              <input
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                inputMode="numeric"
                autoFocus
                style={{
                  width:"100%", boxSizing:"border-box", padding:"16px",
                  borderRadius:16, marginBottom:14,
                  border:`2.5px solid ${code.length >= 6 ? C.primaryDark : C.primaryBorder}`,
                  background:C.bg, fontSize:32, fontWeight:900, letterSpacing:10,
                  textAlign:"center", color:C.text, outline:"none", fontFamily:"inherit",
                }}
                onKeyDown={e => e.key === "Enter" && handleVerify()}
              />

              {error && <ErrorBox msg={error} />}

              <BtnPrimary onClick={handleVerify} fullWidth disabled={loading}>
                {loading
                  ? <><Loader2 size={14} style={{ animation:"spin 1s linear infinite" }} /> {error ? "Qayta urinilmoqda..." : "Tekshirilmoqda..."}</>
                  : <><KeyRound size={14} /> Tasdiqlash va kirish</>
                }
              </BtnPrimary>

              <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:C.textMuted }}>
                Kod kelmadimi?{" "}
                <span onClick={() => { setStep(1); setCode(""); setError(""); }}
                  style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                  Qayta yuborish
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PhoneInput({ value, onChange, onEnter }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position:"relative", marginBottom:12 }}>
      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
                     fontSize:13, color:C.textSub, fontWeight:700, userSelect:"none", pointerEvents:"none" }}>
        +998
      </span>
      <input
        value={value} inputMode="numeric" placeholder="90 000 00 00"
        onChange={e => onChange(formatPhone(e.target.value))}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{
          width:"100%", boxSizing:"border-box", padding:"10px 13px 10px 54px",
          borderRadius:12, border:`1.5px solid ${focus ? C.primary : C.border}`,
          fontSize:15, fontWeight:400, color:C.text, fontFamily:"inherit",
          outline:"none", background:C.bg, transition:"border-color 0.2s", letterSpacing:1,
        }}
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ padding:"9px 13px", borderRadius:10, marginBottom:12,
                  background:"#FFF1F0", color:"#FF4D4F", fontSize:12, fontWeight:600,
                  display:"flex", alignItems:"center", gap:7 }}>
      <AlertTriangle size={13} color="#FF4D4F" /> {msg}
    </div>
  );
}
