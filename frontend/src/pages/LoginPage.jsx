import { useState, useEffect, useRef } from "react";
import { BtnPrimary } from "../components/UI";
import { C } from "../constants";
import { authAPI, setToken } from "../services/api";
import Logo from "../components/Logo";
import {
  Smartphone, Loader2,
  KeyRound, AlertTriangle, ArrowLeft, Send,
} from "lucide-react";

function formatPhone(raw) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7)}`;
}

const BOT_URL = import.meta.env.VITE_TG_BOT_URL || "https://t.me/Requrilishbot";

export default function LoginPage({ onLogin }) {
  const [step,    setStep]    = useState(1);   // 1=phone, 2=otp
  const [phone,   setPhone]   = useState("");
  const [code,    setCode]    = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [needBot, setNeedBot] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const params   = new URLSearchParams(window.location.search);
    const tgToken  = params.get("tgToken");
    const tgPhone  = params.get("phone");
    const tgName   = params.get("name");
    const tgUser   = params.get("telegram");
    const tgChatId = params.get("tgChatId");
    const isReg    = params.get("register") === "1";

    window.history.replaceState({}, "", window.location.pathname);

    const autoLogin = (promise) => {
      setLoading(true);
      timeoutRef.current = setTimeout(() => setLoading(false), 10000);
      promise
        .then((data) => {
          clearTimeout(timeoutRef.current);
          setToken(data.token);
          localStorage.setItem("rm_user", JSON.stringify(data.user));
          onLogin(data.user);
        })
        .catch((e) => {
          clearTimeout(timeoutRef.current);
          setLoading(false);
          if (e?.needBot) setNeedBot(true);
        });
    };

    // 1. Bot yuborgan bir martalik token
    if (tgToken) {
      autoLogin(authAPI.loginWithTgToken(tgToken));
      return () => clearTimeout(timeoutRef.current);
    }

    // 2. Bot yo'naltirgan yangi foydalanuvchi ro'yxati
    if (isReg && tgPhone && tgChatId) {
      const digits = tgPhone.replace(/\D/g, "").slice(-9);
      autoLogin(authAPI.register({
        name: tgName || "Foydalanuvchi",
        phone: digits,
        telegram: tgUser || "",
        tgChatId,
      }));
      return () => clearTimeout(timeoutRef.current);
    }

    // 3. Telegram Mini App ichida — initData bilan avtomatik kirish
    const initData = window.Telegram?.WebApp?.initData;
    if (initData) {
      autoLogin(authAPI.tgInit(initData));
      return () => clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleSendCode = async () => {
    setError(""); setNeedBot(false);
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 9) { setError("To'liq telefon raqam kiriting"); return; }
    setLoading(true);
    try {
      await authAPI.sendCode(digits);
      setStep(2);
    } catch (e) {
      if (e?.needBot || e.message?.includes("ro'yxatdan") || e.message?.includes("Requrilishbot")) {
        setNeedBot(true);
      } else {
        setError(e.message || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError("");
    if (code.trim().length !== 6) { setError("6 xonali kod kiriting"); return; }
    setLoading(true);
    const tgChatId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || null;
    try {
      const data = await authAPI.login({
        phone: phone.replace(/\D/g, ""),
        code: code.trim(),
        tgChatId,
      });
      setToken(data.token);
      localStorage.setItem("rm_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      setError(e.message || "Xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  // Full-screen loading (auto-login in progress)
  if (loading && step === 1 && !phone) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", height:"100vh", background:C.bg, gap:14 }}>
        <Loader2 size={36} color={C.primaryDark}
          style={{ animation:"spin 1s linear infinite" }} />
        <div style={{ fontSize:14, color:C.textMuted }}>Telegram orqali kirilmoqda...</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
      minHeight:"100vh", maxWidth:430, margin:"0 auto",
      display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", padding:"40px 28px",
    }}>
      <div style={{ marginBottom:16 }}><Logo size={80} /></div>
      <div style={{ fontSize:28, fontWeight:900, color:C.text, marginBottom:4 }}>ReQurilish</div>
      <div style={{ fontSize:13, color:C.textMuted, marginBottom:32, textAlign:"center" }}>
        Qurilish materiallari bozori
      </div>

      <div style={{ width:"100%", background:C.card, borderRadius:22,
                    border:`1px solid ${C.border}`, padding:"24px 20px",
                    boxShadow:"0 4px 22px rgba(0,0,0,0.08)" }}>

        {/* ── Step 1: Phone ── */}
        {step === 1 && (
          <>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:16, textAlign:"center" }}>
              Kirish
            </div>

            {needBot ? (
              /* Bot required message */
              <div style={{ textAlign:"center", padding:"8px 0 16px" }}>
                <div style={{ width:56, height:56, borderRadius:18, margin:"0 auto 14px",
                              background:"#E8F6FD", border:"2px solid #2AABEE",
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Send size={28} color="#0088CC" />
                </div>
                <div style={{ fontSize:15, fontWeight:900, color:C.text, marginBottom:8 }}>
                  Bot orqali kiring
                </div>
                <div style={{ fontSize:13, color:C.textMuted, lineHeight:1.6, marginBottom:18 }}>
                  Bu raqam botda ro'yxatdan o'tmagan.<br />
                  @Requrilishbot da /start bosing va telefon raqamingizni yuboring.
                </div>
                <a href={BOT_URL} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                  <button style={{
                    width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    padding:"13px 0", borderRadius:14, border:"1.5px solid #2AABEE",
                    background:"#E8F6FD", color:"#0088CC", fontFamily:"inherit",
                    fontSize:14, fontWeight:800, cursor:"pointer",
                  }}>
                    <Send size={16} color="#0088CC" /> @Requrilishbot ga o'tish
                  </button>
                </a>
                <button onClick={() => setNeedBot(false)}
                  style={{ marginTop:12, background:"none", border:"none", color:C.textMuted,
                           fontSize:12, cursor:"pointer", fontFamily:"inherit" }}>
                  ← Orqaga
                </button>
              </div>
            ) : (
              <>
                <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, marginBottom:6 }}>
                  Telefon raqam *
                </div>
                <PhoneInput value={phone} onChange={setPhone} onEnter={handleSendCode} />

                {error && <ErrorBox msg={error} />}

                <BtnPrimary onClick={handleSendCode} fullWidth disabled={loading}>
                  {loading
                    ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Tekshirilmoqda...</>
                    : <><Smartphone size={15} /> Kod yuborish →</>
                  }
                </BtnPrimary>

                <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0 14px" }}>
                  <div style={{ flex:1, height:1, background:C.border }} />
                  <span style={{ fontSize:11, color:C.textMuted, whiteSpace:"nowrap" }}>yoki</span>
                  <div style={{ flex:1, height:1, background:C.border }} />
                </div>

                <a href={BOT_URL} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                  <button style={{
                    width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                    padding:"11px 0", borderRadius:14, border:"1.5px solid #2AABEE",
                    background:"#E8F6FD", color:"#0088CC", fontFamily:"inherit",
                    fontSize:13, fontWeight:700, cursor:"pointer",
                  }}>
                    <Send size={15} color="#0088CC" /> Telegram orqali kirish
                  </button>
                </a>
                <div style={{ textAlign:"center", marginTop:12, fontSize:11, color:C.textMuted }}>
                  Hisob yo'qmi? <a href={BOT_URL} target="_blank" rel="noreferrer"
                    style={{ color:C.primaryDark, fontWeight:700 }}>
                    @Requrilishbot orqali ro'yxatdan o'ting
                  </a>
                </div>
              </>
            )}
          </>
        )}

        {/* ── Step 2: OTP ── */}
        {step === 2 && (
          <>
            <button onClick={() => { setStep(1); setCode(""); setError(""); }} style={{
              display:"flex", alignItems:"center", gap:5, background:"none",
              border:"none", cursor:"pointer", color:C.textSub,
              fontSize:12, fontWeight:700, marginBottom:20, padding:0, fontFamily:"inherit",
            }}>
              <ArrowLeft size={14} /> Orqaga
            </button>

            <div style={{ textAlign:"center", marginBottom:24 }}>
              <div style={{ width:60, height:60, borderRadius:18, margin:"0 auto 14px",
                            background:"#E8F6FD", border:"2px solid #2AABEE",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Send size={28} color="#0088CC" />
              </div>
              <div style={{ fontSize:18, fontWeight:900, color:C.text, marginBottom:6 }}>
                Telegram kod
              </div>
              <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>
                @Requrilishbot dan 6 xonali kod keldi
              </div>
              <div style={{ display:"inline-block", marginTop:6, background:C.primaryLight,
                            border:`1px solid ${C.primaryBorder}`, borderRadius:10, padding:"5px 14px",
                            fontSize:15, fontWeight:900, color:C.primaryDark }}>
                +998 {phone}
              </div>
            </div>

            <input value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g,"").slice(0,6))}
              placeholder="• • • • • •" inputMode="numeric" autoFocus
              style={{ width:"100%", boxSizing:"border-box", padding:"16px", borderRadius:16, marginBottom:16,
                       border:`2.5px solid ${code.length>=6?C.primaryDark:C.primaryBorder}`,
                       background:C.bg, fontSize:32, fontWeight:900, letterSpacing:10,
                       textAlign:"center", color:C.text, outline:"none", fontFamily:"inherit" }}
              onKeyDown={e => e.key==="Enter" && handleLogin()}
            />

            {error && <ErrorBox msg={error} />}

            <BtnPrimary onClick={handleLogin} fullWidth disabled={loading}>
              {loading
                ? <><Loader2 size={15} style={{ animation:"spin 1s linear infinite" }} /> Tekshirilmoqda...</>
                : <><KeyRound size={15} /> Kirish</>
              }
            </BtnPrimary>

            <div style={{ textAlign:"center", marginTop:14, fontSize:11, color:C.textMuted }}>
              Kod kelmadimi?{" "}
              <span onClick={() => { setStep(1); setCode(""); }}
                style={{ color:C.primaryDark, fontWeight:700, cursor:"pointer" }}>
                Qayta yuborish
              </span>
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PhoneInput({ value, onChange, onEnter }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position:"relative", marginBottom:13 }}>
      <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
                     fontSize:13, color:C.textSub, fontWeight:700, userSelect:"none", pointerEvents:"none" }}>
        +998
      </span>
      <input
        value={value} inputMode="numeric" placeholder="90 000 00 00"
        onChange={e => onChange(formatPhone(e.target.value))}
        onKeyDown={e => e.key==="Enter" && onEnter?.()}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
        style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px 10px 54px",
                 borderRadius:12, border:`1.5px solid ${focus?C.primary:C.border}`,
                 fontSize:15, fontWeight:400, color:C.text, fontFamily:"inherit", outline:"none",
                 background:C.bg, transition:"border-color 0.2s", letterSpacing:1 }}
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{ padding:"10px 14px", borderRadius:10, marginBottom:12,
                  background:"#FFF1F0", color:"#FF4D4F", fontSize:12, fontWeight:600,
                  display:"flex", alignItems:"center", gap:7 }}>
      <AlertTriangle size={14} color="#FF4D4F" />
      {msg}
    </div>
  );
}
