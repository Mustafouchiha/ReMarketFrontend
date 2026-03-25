import { useState, useEffect } from "react";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import PaymentPage from "./pages/PaymentPage";
import { C } from "./constants";
import { getToken, clearAuth, productsAPI, offersAPI, authAPI } from "./services/api";

// Saved user from localStorage (for instant load without flicker)
const savedUser = () => {
  try { return JSON.parse(localStorage.getItem("rm_user")) || null; }
  catch { return null; }
};

export default function App() {
  const [user,       setUser]       = useState(savedUser);
  const [nav,        setNav]        = useState("home"); // home | login | profile | payment
  const [products,   setProducts]   = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [offers,     setOffers]     = useState([]);
  const [homeAction, setHomeAction] = useState(null);
  const [loading,    setLoading]    = useState(!!savedUser());

  const loggedIn = !!user && !!getToken();
  const guestUser = user || { id: null, name: "Mehmon", phone: "", telegram: "", avatar: null };

  // ── On mount: verify token + load data ──────────────────────────
  useEffect(() => {
    // Har doim Home uchun mahsulotlarni yuklaymiz (guest ham ko'rsin)
    (async () => {
      try {
        if (getToken()) {
          const me = await authAPI.me();
          setUser(me);
          localStorage.setItem("rm_user", JSON.stringify(me));
        }
      } catch {
        clearAuth();
        setUser(null);
      } finally {
        await loadData();
        setLoading(false);
      }
    })();
  }, []);

  const loadData = async () => {
    try {
      const prods = await productsAPI.getAll();
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
    } catch { /* silent */ }
  };

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
    // Guest uchun public mahsulotlarni qayta yuklash
    try {
      const prods = await productsAPI.getAll();
      setProducts(prods);
    } catch { /* silent */ }
  };

  const handleAddProduct = async (newProd) => {
    // Called from HomePage after successful API create
    setMyProducts(prev => [newProd, ...prev]);
    // Products feed already excludes own items — no need to add to products[]
  };

  const handleDeleteProduct = async (id) => {
    try {
      await productsAPI.remove(id);
      setMyProducts(prev => prev.filter(p => p.id !== id));
    } catch { /* silent */ }
  };

  const handleUpdateUser = async (updated) => {
    setUser(updated);
    localStorage.setItem("rm_user", JSON.stringify(updated));
  };

  // ── Loading splash ───────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center",
                    height:"100vh", background:C.bg, flexDirection:"column", gap:12 }}>
        <div style={{ width:60, height:60, borderRadius:18,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      display:"flex", alignItems:"center", justifyContent:"center", fontSize:28 }}>♻️</div>
        <div style={{ fontSize:13, color:C.textMuted, fontFamily:"'Nunito','Segoe UI',sans-serif" }}>
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  // ── Login screen ─────────────────────────────────────────────────
  if (!loggedIn && nav === "login") {
    return <LoginPage onLogin={handleLogin} />;
  }

  // ── Bottom nav (barcha sahifalarda ko'rinadi) ────────────────────
  const BottomNav = () => (
    <div style={{
      position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
      width:"100%", maxWidth:430, background:"rgba(255,255,255,0.96)",
      backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`,
      boxShadow:"0 -2px 14px rgba(0,0,0,0.06)",
      display:"flex", alignItems:"center",
      padding:"10px 0 20px", zIndex:30,
    }}>
      {/* Bosh sahifa */}
      <div onClick={() => setNav("home")}
        style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
        <div style={{ fontSize:22, lineHeight:1 }}>🏠</div>
        <div style={{ fontSize:9, marginTop:3,
          color: nav==="home" ? C.primaryDark : C.textMuted,
          fontWeight: nav==="home" ? 800 : 400 }}>Bosh</div>
      </div>

      {/* ➕ E'lon qo'shish */}
      <div onClick={() => { setHomeAction("openAdd"); setNav("home"); }}
        style={{ flex:1, display:"flex", flexDirection:"column",
                 alignItems:"center", cursor:"pointer" }}>
        <div style={{ width:52, height:52, borderRadius:17,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:24, marginTop:-24,
                      boxShadow:`0 6px 20px rgba(255,179,128,0.6)`,
                      border:"3px solid white" }}>➕</div>
        <div style={{ fontSize:9, marginTop:4, color:C.textMuted, fontWeight:400 }}>E'lon</div>
      </div>

      {/* 💳 To'lovlar */}
      <div onClick={() => setNav("payment")}
        style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
        <div style={{ fontSize:22, lineHeight:1 }}>💳</div>
        <div style={{ fontSize:9, marginTop:3,
          color: nav==="payment" ? C.primaryDark : C.textMuted,
          fontWeight: nav==="payment" ? 800 : 400 }}>To'lov</div>
      </div>

      {/* 👤 Profil */}
      <div onClick={() => setNav("profile")}
        style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
        <div style={{ width:30, height:30, borderRadius:"50%", margin:"0 auto",
                      overflow:"hidden",
                      border:`2.5px solid ${nav==="profile" ? C.primaryDark : C.border}`,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      display:"flex", alignItems:"center", justifyContent:"center" }}>
          {user.avatar
            ? <img src={user.avatar} alt="av" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontSize:11, fontWeight:900, color:"white" }}>
                {(user.name||"?").split(" ").map(w=>w[0]).join("").slice(0,2)}
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
      {!loggedIn && nav === "home" && (
        <HomePage
          user={guestUser}
          products={products}
          setProducts={setProducts}
          offers={offers}
          setOffers={setOffers}
          onNavChange={setNav}
          homeAction={homeAction}
          setHomeAction={setHomeAction}
          onProductAdded={handleAddProduct}
          loggedIn={false}
          onRequireAuth={() => setNav("login")}
        />
      )}

      {!loggedIn && nav !== "home" && nav !== "login" && (
        <LoginPage onLogin={handleLogin} />
      )}

      {loggedIn && nav === "profile" && (
        <>
          <ProfilePage
            user={user}
            setUser={handleUpdateUser}
            myProducts={myProducts}
            onDelete={handleDeleteProduct}
            onLogout={handleLogout}
          />
          <BottomNav />
        </>
      )}

      {loggedIn && nav === "payment" && (
        <>
          <PaymentPage user={user} />
          <BottomNav />
        </>
      )}

      {loggedIn && (nav === "home" || (nav !== "profile" && nav !== "payment")) && (
        <HomePage
          user={user}
          products={products}
          setProducts={setProducts}
          offers={offers}
          setOffers={setOffers}
          onNavChange={setNav}
          homeAction={homeAction}
          setHomeAction={setHomeAction}
          onProductAdded={handleAddProduct}
          loggedIn={true}
          onRequireAuth={() => setNav("login")}
        />
      )}
    </div>
  );
}
