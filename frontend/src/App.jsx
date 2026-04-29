import { useState, useEffect, useRef } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import OperatorPage from "./pages/OperatorPage";
import { C } from "./constants";
import { getToken, setToken, clearAuth, productsAPI, offersAPI, authAPI, ping } from "./services/api";
import { Home, Plus } from "lucide-react";

const OPERATOR_PHONES = ["331350206"];
const phoneCore = (v) => {
  const d = String(v || "").replace(/\D/g, "");
  return d.startsWith("998") ? d.slice(-9) : d.slice(-9);
};
const isOperator = (user) => user && (
  OPERATOR_PHONES.includes(phoneCore(user.phone)) || user.role === "operator"
);

const savedUser = () => {
  try { return JSON.parse(localStorage.getItem("rm_user")) || null; }
  catch { return null; }
};

function hasTgParams() {
  const p = new URLSearchParams(window.location.search);
  if (p.has("tgToken") || p.get("register") === "1") return true;
  return !!window.Telegram?.WebApp?.initData;
}

// ── Loading splash (qurilish tematikasi) ─────────────────────────
function LoadingSplash() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                  height:"100vh", background:C.bg, flexDirection:"column", gap:14 }}>
      <div style={{ width:72, height:72, borderRadius:22,
                    background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:34, boxShadow:`0 8px 24px rgba(244,137,74,0.4)`,
                    animation:"pulse 1.5s ease-in-out infinite" }}>
        🏗
      </div>
      <div style={{ fontSize:18, fontWeight:800, color:C.text, fontFamily:"'Nunito','Segoe UI',sans-serif" }}>
        ReQurilish
      </div>
      <div style={{ display:"flex", gap:6 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{
            width:8, height:8, borderRadius:"50%", background:C.primaryDark,
            animation:`bounce 1.2s ${i*0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
        @keyframes bounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-8px);opacity:1} }
      `}</style>
    </div>
  );
}

export default function App() {
  const cached = savedUser();

  const [user,       setUser]       = useState(cached);
  const [nav,        setNav]        = useState("home"); // always start at home
  const [products,   setProducts]   = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [offers,     setOffers]     = useState([]);
  const [homeAction, setHomeAction] = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [offline,    setOffline]    = useState(false);
  const pollRef = useRef(null);

  const loggedIn = !!user && !!getToken();
  const guestUser = user || { id: null, name: "Mehmon", phone: "", telegram: "", avatar: null };

  const loadData = async () => {
    try {
      const prods = await productsAPI.getAll();
      setOffline(false);
      setProducts(prods);
      if (getToken()) {
        const [my, offs] = await Promise.all([
          productsAPI.getMy(),
          offersAPI.getReceived(),
        ]);
        setMyProducts(my);
        setOffers(offs);
      } else {
        setMyProducts([]);
        setOffers([]);
      }
    } catch (e) {
      if (e.offline) setOffline(true);
    }
  };

  // Render ni uyg'otish: ilova ochilganda va har 4 daqiqada ping
  useEffect(() => {
    ping();
    const warmup  = [3000, 7000, 13000, 20000, 30000].map(d => setTimeout(ping, d));
    const keepAlive = setInterval(ping, 4 * 60 * 1000); // 4 daqiqada 1 marta
    return () => { warmup.forEach(clearTimeout); clearInterval(keepAlive); };
  }, []);

  // Auto-login silently in background
  useEffect(() => {

    const params   = new URLSearchParams(window.location.search);
    const tgToken  = params.get("tgToken");
    const tgPhone  = params.get("phone");
    const tgName   = params.get("name");
    const tgUser   = params.get("telegram");
    const tgChatId = params.get("tgChatId");
    const isReg    = params.get("register") === "1";
    if (tgToken || isReg) window.history.replaceState({}, "", window.location.pathname);

    (async () => {
      try {
        if (tgToken) {
          const data = await authAPI.loginWithTgToken(tgToken);
          setToken(data.token);
          localStorage.setItem("rm_user", JSON.stringify(data.user));
          setUser(data.user);
        } else if (isReg && tgPhone && tgChatId) {
          const data = await authAPI.register({
            name:     tgName || "Foydalanuvchi",
            phone:    tgPhone.replace(/\D/g, "").slice(-9),
            telegram: tgUser || "",
            tgChatId,
          });
          setToken(data.token);
          localStorage.setItem("rm_user", JSON.stringify(data.user));
          setUser(data.user);
        } else if (getToken()) {
          // Verify existing token silently
          try {
            const me = await authAPI.me();
            setUser(me);
            localStorage.setItem("rm_user", JSON.stringify(me));
          } catch {
            clearAuth();
            setUser(null);
          }
        } else {
          // Try Telegram initData auto-login (silent — guest if not registered)
          const initData = window.Telegram?.WebApp?.initData;
          if (initData) {
            try {
              const data = await authAPI.tgInit(initData);
              setToken(data.token);
              localStorage.setItem("rm_user", JSON.stringify(data.user));
              setUser(data.user);
            } catch { /* not registered yet, stay as guest */ }
          }
        }
      } catch { /* silent */ }
      loadData();
    })();
  }, []);

  // Real-time polling: 10s interval
  useEffect(() => {
    pollRef.current = setInterval(loadData, 3_000);
    return () => clearInterval(pollRef.current);
  }, []);

  // visibilitychange — tab qaytganda darhol yangilansin
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") loadData();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Telegram WebApp "activated" event
  useEffect(() => {
    const twa = window.Telegram?.WebApp;
    if (!twa) return;
    const onActivated = () => loadData();
    twa.onEvent?.("activated", onActivated);
    return () => twa.offEvent?.("activated", onActivated);
  }, []);

  const handleLogin = async (userData) => {
    setUser(userData);
    await loadData();
    setNav("home");
  };

  const handleLogout = async () => {
    clearAuth();
    setUser(null);
    setMyProducts([]);
    setOffers([]);
    setNav("home");
    try { setProducts(await productsAPI.getAll()); } catch { /* silent */ }
  };

  const handleAddProduct = (newProd) => {
    setMyProducts(prev => [newProd, ...prev]);
  };

  const handleDeleteProduct = async (id) => {
    try {
      await productsAPI.remove(id);
      // Mark deleted locally; ProfilePage filter will hide it
      setMyProducts(prev => prev.map(p => p.id === id ? { ...p, status: "deleted" } : p));
    } catch (e) {
      console.error("Delete failed:", e.message);
    }
  };

  const handleUpdateUser = (updated) => {
    setUser(updated);
    localStorage.setItem("rm_user", JSON.stringify(updated));
  };

  if (loading) return <LoadingSplash />;

  if (!loggedIn && nav === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }

  const BottomNav = () => (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430, background:"rgba(255,255,255,0.97)",
      backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`,
      boxShadow:"0 -2px 14px rgba(0,0,0,0.06)",
      display:"flex", alignItems:"center",
      padding:"10px 0 20px", zIndex:30,
    }}>
      <div onClick={() => setNav("home")}
        style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
        <div style={{ display:"flex", justifyContent:"center" }}>
          <Home size={22} color={nav==="home" ? C.primaryDark : C.textMuted} />
        </div>
        <div style={{ fontSize:9, marginTop:3,
          color: nav==="home" ? C.primaryDark : C.textMuted,
          fontWeight: nav==="home" ? 800 : 400 }}>Bosh</div>
      </div>

      <div onClick={() => { setHomeAction("openAdd"); setNav("home"); }}
        style={{ flex:1, display:"flex", flexDirection:"column",
                 alignItems:"center", cursor:"pointer" }}>
        <div style={{ width:52, height:52, borderRadius:17,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      marginTop:-24, boxShadow:`0 6px 20px rgba(255,179,128,0.6)`,
                      border:"3px solid white" }}>
          <Plus size={26} color="white" strokeWidth={2.5} />
        </div>
        <div style={{ fontSize:9, marginTop:4, color:C.textMuted, fontWeight:400 }}>E'lon</div>
      </div>

      <div onClick={() => setNav("profile")}
        style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
        <div style={{ width:30, height:30, borderRadius:"50%", margin:"0 auto",
                      overflow:"hidden",
                      border:`2.5px solid ${nav==="profile" ? C.primaryDark : C.border}`,
                      background: (loggedIn && user?.avatar) ? "transparent"
                        : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
          {loggedIn && user?.avatar
            ? <img src={user.avatar} alt="av" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:11, fontWeight:900, color:"white" }}>
                {((loggedIn ? user?.name : "M") || "?").split(" ").map(w=>w[0]).join("").slice(0,2)}
              </span>
          }
        </div>
        <div style={{ fontSize:9, marginTop:3,
          color: nav==="profile" ? C.primaryDark : C.textMuted,
          fontWeight: nav==="profile" ? 700 : 400 }}>Profil</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg }}>
      {offline && (
        <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)",
                      width:"100%", maxWidth:430, zIndex:999,
                      background:"#EF4444", color:"white",
                      padding:"10px 16px", display:"flex", alignItems:"center",
                      justifyContent:"space-between", gap:10, boxSizing:"border-box",
                      boxShadow:"0 2px 12px rgba(239,68,68,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:16 }}>🔴</span>
            <div>
              <div style={{ fontSize:12, fontWeight:800 }}>Server ishlamayapti</div>
              <div style={{ fontSize:10, opacity:0.85 }}>Ulanish yo'q</div>
            </div>
          </div>
          <button onClick={loadData}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"white",
                     borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700,
                     cursor:"pointer" }}>
            Qayta
          </button>
        </div>
      )}

      {/* Guest: faqat home */}
      {!loggedIn && nav === "home" && (
        <HomePage
          user={guestUser} products={products} setProducts={setProducts}
          offers={offers} setOffers={setOffers}
          onNavChange={setNav} homeAction={homeAction} setHomeAction={setHomeAction}
          onProductAdded={handleAddProduct} loggedIn={false}
          onRequireAuth={() => setNav("login")}
        />
      )}
      {!loggedIn && nav !== "home" && nav !== "login" && (
        <LoginPage onLogin={handleLogin} />
      )}

      {/* Logged in: operator */}
      {loggedIn && nav === "operator" && (
        <OperatorPage onBack={() => setNav("profile")} user={user} />
      )}

      {/* Logged in: profile */}
      {loggedIn && nav === "profile" && (
        <>
          <ProfilePage
            user={user} setUser={handleUpdateUser}
            myProducts={myProducts} onDelete={handleDeleteProduct}
            onLogout={handleLogout} isOperator={isOperator(user)}
            onOpenOperator={() => setNav("operator")}
          />
          <BottomNav />
        </>
      )}

      {/* Logged in: home (and any unmatched nav) */}
      {loggedIn && nav !== "operator" && nav !== "profile" && (
        <>
          <HomePage
            user={user} products={products} setProducts={setProducts}
            offers={offers} setOffers={setOffers}
            onNavChange={setNav} homeAction={homeAction} setHomeAction={setHomeAction}
            onProductAdded={handleAddProduct} onDelete={handleDeleteProduct}
            isOperator={isOperator(user)} loggedIn={true}
            onRequireAuth={() => setNav("login")}
          />
          <BottomNav />
        </>
      )}
    </div>
  );
}
