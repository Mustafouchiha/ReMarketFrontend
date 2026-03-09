import { useState, useEffect } from "react";
import { Pill, BtnPrimary, BtnGhost, Sheet, Lbl, TInput } from "../components/UI";
import PCard from "../components/ProductCard";
import LocIcon from "../components/LocIcon";
import PhotoUpload from "../components/PhotoUpload";
import StepBar from "../components/StepBar";
import { C, COND, UZ, CATS, CAT_ICO, EMPTY_FORM, OPERATOR } from "../constants";
import { productsAPI, offersAPI } from "../services/api";

export default function HomePage({
  user,
  products,
  setProducts,
  offers,
  setOffers,
  onNavChange,
  homeAction,
  setHomeAction,
  onProductAdded,
  loggedIn,
  onRequireAuth,
}) {
  const [search,     setSearch]     = useState("");
  const [activeCats, setActiveCats] = useState([]); // bo'sh => Barchasi
  const [selected,  setSelected]  = useState(null);
  const [showOffer,   setShowOffer]   = useState(false);
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [showBuyer,   setShowBuyer]   = useState(null);
  const [showLoc,  setShowLoc]  = useState(false);
  const [fVil,     setFVil]     = useState("");
  const [fTum,     setFTum]     = useState("");
  const [tVil,     setTVil]     = useState("");
  const [tTum,     setTTum]     = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [step,    setStep]    = useState(1);
  const [form,    setForm]    = useState(EMPTY_FORM);

  const f = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const catOk = activeCats.length === 0 || activeCats.includes(p.category);
    return catOk
      && (!search || p.name.toLowerCase().includes(q) || (p.viloyat||"").toLowerCase().includes(q) || (p.tuman||"").toLowerCase().includes(q))
      && (!fVil || p.viloyat===fVil)
      && (!fTum || p.tuman===fTum);
  });

  const openLoc    = () => { setTVil(fVil); setTTum(fTum); setShowLoc(true); };
  const applyLoc   = () => { setFVil(tVil); setFTum(tVil?tTum:""); setShowLoc(false); };
  const clearLoc   = () => { setTVil(""); setTTum(""); setFVil(""); setFTum(""); setShowLoc(false); };
  const requireAuth = () => {
    if (onRequireAuth) onRequireAuth();
    else onNavChange && onNavChange("login");
  };

  const openAdd    = () => {
    if (!loggedIn) return requireAuth();
    setForm(EMPTY_FORM); setStep(1); setShowAdd(true);
  };
  const closeAdd   = () => { setShowAdd(false); setStep(1); setForm(EMPTY_FORM); };

  useEffect(() => {
    if (homeAction === "openAdd") {
      openAdd();
      setHomeAction(null);
    }
  }, [homeAction]);

  const anySheetOpen =
    showLoc || !!selected || showOffer || showNotifs || !!showPayment || !!showBuyer || showAdd;

  const [submitting, setSubmitting] = useState(false);
  const [offerSending, setOfferSending] = useState(false);

  const submitProd = async () => {
    if (!form.name||!form.price||!form.qty||!form.viloyat||!form.photo) return;
    setSubmitting(true);
    try {
      const newProd = await productsAPI.create({
        ...form,
        price: parseInt(form.price),
        qty:   parseInt(form.qty),
      });
      if (onProductAdded) onProductAdded(newProd);
      closeAdd();
    } catch (e) {
      alert(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const sendOffer = async (product) => {
    if (!loggedIn) return requireAuth();
    setOfferSending(true);
    try {
      const offer = await offersAPI.send(product.id);
      setOffers(prev => [offer, ...prev]);
      setShowOffer(false);
      setSelected(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setOfferSending(false);
    }
  };

  const confirmPayment = async (offerId) => {
    try {
      await offersAPI.markPaid(offerId);
      setOffers(prev => prev.map(o => o.id===offerId ? {...o, status:"paid"} : o));
      setShowPayment(null);
    } catch (e) {
      alert(e.message);
    }
  };

  // offers — already the current user's received offers (filtered on backend)
  const myNotifs    = offers;
  const unreadCount = myNotifs.filter(o => o.status === "pending").length;

  const isLocOn = !!fVil;
  const locLabel = fVil ? (fTum||fVil) : "Joylashuv";
  const canStep2 = !!form.photo;
  const canStep3 = form.name && form.price && form.qty;
  const canStep4 = !!form.viloyat;

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
                  minHeight:"100vh", paddingBottom:84, maxWidth:430,
                  margin:"0 auto", position:"relative",
                  overflowY:anySheetOpen ? "hidden" : "auto",
                  height:anySheetOpen ? "100vh" : "auto" }}>

      {/* bg glow */}
      <div style={{ position:"fixed", top:-100, right:-80, width:280, height:280, borderRadius:"50%",
                    background:"radial-gradient(circle,rgba(255,179,128,0.12) 0%,transparent 70%)",
                    pointerEvents:"none", zIndex:0 }} />

      {/* ═══ STICKY HEADER ═══ */}
      <div style={{ padding:"16px 16px 12px", background:"rgba(255,255,255,0.93)",
                    backdropFilter:"blur(14px)", position:"sticky", top:0, zIndex:20,
                    borderBottom:`1px solid ${C.border}`, boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <span style={{ fontSize:22 }}>♻️</span>
              <span style={{ fontSize:20, fontWeight:900, color:C.text, letterSpacing:"-0.4px" }}>ReMarket</span>
            </div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>Qayta ishlangan qurilish materiallari</div>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            {/* location btn */}
            <button onClick={openLoc}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 11px",
                       borderRadius:12, border:`1.5px solid ${isLocOn?C.primary:C.border}`,
                       background:isLocOn?C.primaryLight:C.card,
                       color:isLocOn?C.primaryDark:C.textSub,
                       fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                       boxShadow:isLocOn?`0 2px 10px rgba(255,179,128,0.28)`:C.shadow,
                       maxWidth:124, overflow:"hidden" }}>
              <LocIcon size={14} color={isLocOn ? C.primaryDark : C.textSub}/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{locLabel}</span>
              <span style={{ fontSize:9, flexShrink:0 }}>▾</span>
            </button>
            {/* 🔔 Xabarnoma qo'ng'irog'i */}
            <div style={{ position:"relative", cursor:"pointer" }} onClick={() => (loggedIn ? setShowNotifs(true) : requireAuth())}>
              <div style={{ width:40, height:40, borderRadius:12,
                            background: unreadCount>0 ? C.primaryLight : C.bg,
                            border:`1.5px solid ${unreadCount>0 ? C.primaryBorder : C.border}`,
                            display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>🔔</div>
              {unreadCount > 0 && (
                <div style={{ position:"absolute", top:-4, right:-4, width:18, height:18,
                              background:C.primaryDark, borderRadius:"50%", fontSize:9,
                              color:"white", fontWeight:800, border:"2px solid white",
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {unreadCount}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* search */}
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", fontSize:14, opacity:0.4 }}>🔍</span>
          <input placeholder="Material, shahar, tuman..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px 10px 37px",
                     borderRadius:13, border:`1.5px solid ${C.border}`, background:C.bg,
                     fontSize:13, color:C.text, outline:"none", fontFamily:"inherit",
                     transition:"border-color 0.2s" }}
            onFocus={e=>e.target.style.borderColor=C.primary}
            onBlur={e=>e.target.style.borderColor=C.border}
          />
        </div>
      </div>

      {/* ═══ HOME FEED ═══ */}
      {/* category pills */}
      <div style={{ padding:"10px 16px", display:"flex", flexWrap:"wrap", gap:7 }}>
        {CATS.map(cat => {
          if (cat === "Barchasi") {
            const isAll = activeCats.length === 0;
            return (
              <Pill
                key={cat}
                active={isAll}
                onClick={() => setActiveCats([])}
              >
                Barchasi
              </Pill>
            );
          }
          const isActive = activeCats.includes(cat);
          const toggle = () => {
            setActiveCats(prev => {
              if (prev.includes(cat)) {
                const next = prev.filter(c => c !== cat);
                return next;
              }
              return [...prev, cat];
            });
          };
          return (
            <Pill
              key={cat}
              active={isActive}
              onClick={toggle}
            >
              {cat}
            </Pill>
          );
        })}
      </div>

      {/* active location chip */}
      {isLocOn && (
        <div style={{ padding:"0 16px 8px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                        background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                        borderRadius:20, padding:"4px 12px",
                        fontSize:11, color:C.primaryDark, fontWeight:700 }}>
            <LocIcon size={11} color={C.primaryDark}/> {fVil}{fTum?` › ${fTum}`:""}
            <span onClick={clearLoc} style={{ cursor:"pointer", fontWeight:900, opacity:0.65 }}>✕</span>
          </div>
        </div>
      )}

      <div style={{ padding:"2px 16px 12px" }}>
        <span style={{ fontSize:11, color:C.textMuted, fontWeight:600 }}>{filtered.length} ta mahsulot</span>
      </div>

      {/* grid */}
      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {filtered.map(p => <PCard key={p.id} p={p} isOwn={loggedIn && p.ownerId===user.id} onClick={() => setSelected(p)} />)}
      </div>

      {filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.textMuted }}>
          <div style={{ fontSize:44, marginBottom:10 }}>🔍</div>
          <div style={{ fontSize:14, fontWeight:700 }}>Hech narsa topilmadi</div>
          <div style={{ fontSize:11, marginTop:4 }}>Filtr yoki qidiruvni o'zgartiring</div>
        </div>
      )}

      {/* ═══ LOCATION SHEET ═══ */}
      {showLoc && (
        <Sheet onClose={() => setShowLoc(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><LocIcon size={15} color={C.primaryDark}/> Joylashuv filtri</span></div>
          <Lbl>Viloyat / Shahar</Lbl>
          <div style={{ display:"flex", flexWrap:"wrap", gap:7, marginBottom:16 }}>
            {Object.keys(UZ).map(v => (
              <Pill key={v} active={tVil===v} onClick={() => { setTVil(tVil===v?"":v); setTTum(""); }}>{v}</Pill>
            ))}
          </div>
          {tVil && (
            <>
              <Lbl>Tuman — {tVil}</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
                {UZ[tVil].map(t => (
                  <Pill key={t} active={tTum===t} accent onClick={() => setTTum(tTum===t?"":t)}>{t}</Pill>
                ))}
              </div>
            </>
          )}
          <div style={{ display:"flex", gap:9 }}>
            <BtnGhost onClick={clearLoc}>🗑 Tozalash</BtnGhost>
            <BtnPrimary onClick={applyLoc}>✅ Qo'llash</BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* ═══ PRODUCT DETAIL SHEET ═══ */}
      {selected && (
        <Sheet onClose={() => setSelected(null)} maxH="80vh">
          {/* big photo */}
          <div style={{ width:"100%", height:200, borderRadius:18, overflow:"hidden",
                        background:C.primaryLight, marginBottom:16,
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
            {selected.photo
              ? <img src={selected.photo} alt={selected.name}
                  style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <div style={{ fontSize:56, opacity:0.25 }}>📷</div>
            }
          </div>

          <div style={{ fontSize:19, fontWeight:900, color:C.text, marginBottom:8 }}>{selected.name}</div>

          {/* Manzilni alohida va kattaroq qilib ko'rsatish */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, color:C.textMuted, marginBottom:4 }}>
              Manzil
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6,
                          padding:"6px 10px", borderRadius:10,
                          background:C.bg, border:`1px solid ${C.border}` }}>
              <LocIcon size={14} color={C.primaryDark} />
              <span style={{ fontSize:13, fontWeight:700, color:C.text }}>
                {selected.viloyat}{selected.tuman?` › ${selected.tuman}`:""}
              </span>
            </div>
          </div>
          {(() => { const cc=COND[selected.condition]; return (
            <span style={{ fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:10,
                           background:cc.bg, color:cc.text, display:"inline-block", marginBottom:16 }}>
              ● {selected.condition} holat
            </span>
          );})()}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:9, marginBottom:18 }}>
            {[["💰","Narx",`${selected.price.toLocaleString()} so'm/${selected.unit}`],
              ["📦","Miqdor",`${selected.qty} ${selected.unit}`],
              ["🏷","Toifa",selected.category]].map(([ic,l,v])=>(
              <div key={l} style={{ background:C.bg, borderRadius:12, padding:"10px 7px",
                                    textAlign:"center", border:`1px solid ${C.border}` }}>
                <div style={{ fontSize:14, marginBottom:2 }}>{ic}</div>
                <div style={{ fontSize:9, color:C.textMuted, marginBottom:2 }}>{l}</div>
                <div style={{ fontSize:10, fontWeight:700, color:C.text }}>{v}</div>
              </div>
            ))}
          </div>

          {selected.ownerId === user.id ? (
            /* O'z mahsuloti */
            <div style={{ background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                          borderRadius:14, padding:"12px 16px", textAlign:"center" }}>
              <div style={{ fontSize:18, marginBottom:4 }}>🏷️</div>
              <div style={{ fontSize:12, fontWeight:700, color:C.primaryDark }}>Bu sizning e'loningiz</div>
              <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>O'z mahsulotingizni sotib ololmaysiz</div>
            </div>
          ) : (
            <div style={{ display:"flex", gap:9 }}>
              <BtnGhost onClick={() => setSelected(null)}>Yopish</BtnGhost>
              <BtnPrimary onClick={() => { if (!loggedIn) return requireAuth(); setShowOffer(selected); }}>📨 Taklif yuborish</BtnPrimary>
            </div>
          )}

          {selected.ownerId === user.id && (
            <div style={{ marginTop:10, display:"flex", justifyContent:"center" }}>
              <BtnGhost onClick={() => setSelected(null)}>Yopish</BtnGhost>
            </div>
          )}
        </Sheet>
      )}

      {/* ═══ 1. TAKLIF YUBORISH SHEET ═══ */}
      {showOffer && (
        <Sheet onClose={() => setShowOffer(false)} maxH="72vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6 }}>📨 Taklif yuborish</div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:18 }}>
            Sizning ma'lumotlaringiz mahsulot egasiga yuboriladi
          </div>

          {/* Mahsulot preview */}
          <div style={{ display:"flex", gap:12, alignItems:"center", background:C.primaryLight,
                        borderRadius:14, padding:"10px 13px", marginBottom:16,
                        border:`1px solid ${C.primaryBorder}` }}>
            <div style={{ width:52, height:52, borderRadius:12, overflow:"hidden", flexShrink:0,
                          background:C.bg }}>
              {showOffer.photo
                ? <img src={showOffer.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <div style={{ fontSize:24, textAlign:"center", lineHeight:"52px", opacity:0.3 }}>📷</div>
              }
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{showOffer.name}</div>
              <div style={{ fontSize:12, color:C.primaryDark, fontWeight:700 }}>
                {showOffer.price?.toLocaleString()} so'm/{showOffer.unit}
              </div>
              <div style={{ fontSize:10, color:C.textMuted }}>Mahsulot ID: #{showOffer.id}</div>
            </div>
          </div>

          {/* Yuboriluvchi ma'lumotlar */}
          <div style={{ background:C.bg, borderRadius:14, padding:"12px 14px",
                        marginBottom:16, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.textSub, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>
              Sizning ma'lumotlaringiz
            </div>
            {[["👤","Ism",user.name],
              ["📞","Telefon",user.phone],
              ["✈️","Telegram",user.telegram||"@noma'lum"],
              ["🆔","Mahsulot ID",`#${showOffer.id}`]].map(([ic,l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between",
                                    padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.textSub }}>{ic} {l}</span>
                <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize:11, color:C.textMuted, marginBottom:16, lineHeight:1.6,
                        background:"#FFFBEB", borderRadius:12, padding:"10px 13px",
                        border:"1px solid #FDE68A" }}>
            ℹ️ Taklif yuborgandan so'ng mahsulot egasi sizga bog'lanadi. To'lov faqat operator orqali amalga oshiriladi.
          </div>

          <div style={{ display:"flex", gap:9 }}>
            <BtnGhost onClick={() => setShowOffer(false)}>Bekor</BtnGhost>
            <BtnPrimary onClick={() => sendOffer(showOffer)} disabled={offerSending}>
              {offerSending ? "⏳ Yuborilmoqda..." : "📨 Taklif yuborish"}
            </BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* ═══ 2. XABARNOMALAR SHEET (egaga kelgan takliflar) ═══ */}
      {showNotifs && (
        <Sheet onClose={() => setShowNotifs(false)} maxH="85vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:18 }}>
            🔔 Xabarnomalar
            {myNotifs.length>0 && (
              <span style={{ marginLeft:8, fontSize:12, color:C.textMuted, fontWeight:500 }}>
                ({myNotifs.length} ta)
              </span>
            )}
          </div>

          {myNotifs.length===0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
              <div style={{ fontSize:44, marginBottom:10 }}>🔔</div>
              <div style={{ fontSize:13, fontWeight:700 }}>Hali xabarnoma yo'q</div>
              <div style={{ fontSize:11, marginTop:4 }}>E'lonlaringizga taklif kelganda bu yerda ko'rinadi</div>
            </div>
          ) : (
            myNotifs.map(o => {
              return (
                <div key={o.id} style={{ background:C.bg, borderRadius:16, padding:"13px 14px",
                                          marginBottom:10, border:`1px solid ${o.status==="paid"?C.primaryBorder:C.border}` }}>
                  {/* status badge */}
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:8,
                                   background: o.status==="paid" ? "#E8F8F0" : "#FFF8E6",
                                   color: o.status==="paid" ? "#28A869" : "#D4920A" }}>
                      {o.status==="paid" ? "✅ To'landi" : "⏳ Kutilmoqda"}
                    </span>
                    <span style={{ fontSize:9, color:C.textMuted }}>
                      {new Date(o.sentAt).toLocaleDateString("uz-UZ")}
                    </span>
                  </div>

                  {/* product info */}
                  <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:2 }}>
                    📦 {o.productName} <span style={{ color:C.textMuted, fontWeight:500 }}>(ID: #{o.productId})</span>
                  </div>

                  {/* xaridor kim */}
                  <div style={{ fontSize:11, color:C.textSub, marginBottom:10 }}>
                    👤 <b>{o.buyerName}</b> sizning mahsulotingizni olmoqchi
                  </div>

                  {o.status==="paid" ? (
                    /* To'landi — xaridor ma'lumotini ko'rish */
                    <button onClick={() => setShowBuyer(o)}
                      style={{ width:"100%", padding:"10px", borderRadius:12, border:"none",
                               background:"linear-gradient(135deg,#28A869,#1a8f50)",
                               color:"white", fontSize:12, fontWeight:700,
                               cursor:"pointer", fontFamily:"inherit" }}>
                      👤 Xaridor ma'lumotlarini ko'rish
                    </button>
                  ) : (
                    /* To'lanmagan — to'lov havolasi */
                    <button onClick={() => setShowPayment(o)}
                      style={{ width:"100%", padding:"10px", borderRadius:12, border:"none",
                               background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                               color:"white", fontSize:12, fontWeight:700,
                               cursor:"pointer", fontFamily:"inherit" }}>
                      💳 To'lov havolasini ko'rish
                    </button>
                  )}
                </div>
              );
            })
          )}
        </Sheet>
      )}

      {/* ═══ 3. TO'LOV SHEET ═══ */}
      {showPayment && (
        <Sheet onClose={() => setShowPayment(null)} maxH="80vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:18 }}>💳 To'lov ma'lumoti</div>

          {/* Mahsulot ID va 5% */}
          <div style={{ background:C.primaryLight, borderRadius:16, padding:"14px 16px",
                        marginBottom:14, border:`1px solid ${C.primaryBorder}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:11, color:C.textSub }}>Mahsulot ID</span>
              <span style={{ fontSize:13, fontWeight:800, color:C.text }}>#{showPayment.productId}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <span style={{ fontSize:11, color:C.textSub }}>Mahsulot narxi</span>
              <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{showPayment.productPrice?.toLocaleString()} so'm</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between",
                          borderTop:`1px solid ${C.primaryBorder}`, paddingTop:8, marginTop:4 }}>
              <span style={{ fontSize:12, fontWeight:700, color:C.primaryDark }}>Xizmat haqi (5%)</span>
              <span style={{ fontSize:16, fontWeight:900, color:C.primaryDark }}>
                {Math.round(showPayment.productPrice * 0.05).toLocaleString()} so'm
              </span>
            </div>
          </div>

          {/* Operator karta */}
          <div style={{ background:"#1C1C1E", borderRadius:16, padding:"16px", marginBottom:14 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Operator karta raqami</div>
            <div style={{ fontSize:20, fontWeight:900, color:"white", letterSpacing:2, marginBottom:8 }}>
              {OPERATOR.card}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>{OPERATOR.name}</div>
          </div>

          {/* Operator telegram */}
          <div style={{ background:"#E8F4FD", borderRadius:14, padding:"12px 14px",
                        marginBottom:14, border:"1px solid #BFDBF7",
                        display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#0088CC",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:20, flexShrink:0 }}>✈️</div>
            <div>
              <div style={{ fontSize:11, color:"#0088CC", fontWeight:700 }}>Operator Telegram</div>
              <div style={{ fontSize:15, fontWeight:900, color:"#005580" }}>{OPERATOR.telegram}</div>
              <div style={{ fontSize:10, color:"#6B7280", marginTop:2 }}>Chekni shu manzilga yuboring</div>
            </div>
          </div>

          <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.7, marginBottom:18,
                        background:"#FFFBEB", borderRadius:12, padding:"10px 13px",
                        border:"1px solid #FDE68A" }}>
            1️⃣ Yuqoridagi kartaga <b>{Math.round(showPayment.productPrice * 0.05).toLocaleString()} so'm</b> o'tkazing<br/>
            2️⃣ To'lov chekini <b>{OPERATOR.telegram}</b> ga yuboring<br/>
            3️⃣ Operator xaridor ma'lumotlarini sizga ochib beradi
          </div>

          {/* Demo: Operator chek ko'rib tasdiqladi tugmasi */}
          <div style={{ display:"flex", gap:9 }}>
            <BtnGhost onClick={() => setShowPayment(null)}>Yopish</BtnGhost>
            <BtnPrimary onClick={() => confirmPayment(showPayment.id)}>
              ✅ To'lov tasdiqlandi (demo)
            </BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* ═══ 4. XARIDOR MA'LUMOTI SHEET ═══ */}
      {showBuyer && (
        <Sheet onClose={() => setShowBuyer(null)} maxH="65vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6 }}>
            👤 Xaridor ma'lumotlari
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:18 }}>
            To'lov tasdiqlangani uchun quyidagi ma'lumotlar ochildi
          </div>

          <div style={{ background:"#E8F8F0", borderRadius:16, padding:"16px",
                        border:"1px solid #A7F3D0", marginBottom:18 }}>
            <div style={{ fontSize:24, textAlign:"center", marginBottom:12 }}>✅</div>
            {[["👤","Ism",showBuyer.buyerName],
              ["📞","Telefon",showBuyer.buyerPhone],
              ["✈️","Telegram",showBuyer.buyerTelegram],
              ["🆔","Mahsulot ID",`#${showBuyer.productId}`]].map(([ic,l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between",
                                    padding:"9px 0", borderBottom:"1px solid rgba(0,0,0,0.06)" }}>
                <span style={{ fontSize:12, color:"#065F46" }}>{ic} {l}</span>
                <span style={{ fontSize:13, fontWeight:800, color:"#064E3B" }}>{v}</span>
              </div>
            ))}
          </div>

          <BtnGhost onClick={() => setShowBuyer(null)}>Yopish</BtnGhost>
        </Sheet>
      )}

      {/* ═══ ADD PRODUCT SHEET (4 steps) ═══ */}
      {showAdd && (
        <Sheet onClose={closeAdd} maxH="92vh">
          <StepBar steps={["📷 Rasm","📦 Ma'lumot","🗺 Joylashuv","✅ Tasdiqlash"]} current={step} />

          {/* STEP 1 — Photo (required) */}
          {step===1 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14 }}>
                📷 Mahsulot rasmi <span style={{ fontSize:11, color:C.danger }}>*</span>
              </div>
              <PhotoUpload photo={form.photo} onPhoto={f("photo")} required />
              {!form.photo && (
                <div style={{ fontSize:11, color:C.danger, marginBottom:12, fontWeight:600 }}>
                  ⚠️ Rasm yuklash majburiy
                </div>
              )}
              <BtnPrimary onClick={() => canStep2 && setStep(2)} disabled={!canStep2} fullWidth>
                Davom etish →
              </BtnPrimary>
            </>
          )}

          {/* STEP 2 — Details */}
          {step===2 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14 }}>📦 Mahsulot ma'lumoti</div>

              {/* photo mini-preview */}
              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16,
                            background:C.primaryLight, borderRadius:14, padding:"10px 12px",
                            border:`1px solid ${C.primaryBorder}` }}>
                <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0 }}>
                  <img src={form.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
                <div style={{ fontSize:11, color:C.textSub, fontWeight:600 }}>
                  Rasm yuklandi ✅
                  <div style={{ fontSize:10, color:C.textMuted }}>1-qadamga qaytib o'zgartirishingiz mumkin</div>
                </div>
              </div>

              <Lbl>Nom *</Lbl>
              <TInput placeholder="Masalan: Eski g'isht" value={form.name} onChange={f("name")} />

              <Lbl>Kategoriya</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                {["g'isht","metall","yog'och","beton","boshqa"].map(c => (
                  <Pill key={c} active={form.category===c} onClick={()=>f("category")(c)}>
                    {CAT_ICO[c]} {c}
                  </Pill>
                ))}
              </div>

              <Lbl>Holati</Lbl>
              <div style={{ display:"flex", gap:7, marginBottom:14 }}>
                {["A'lo","Yaxshi","O'rta"].map(c => { const cc=COND[c]; return (
                  <button key={c} onClick={()=>f("condition")(c)}
                    style={{ flex:1, padding:"9px 4px", borderRadius:11,
                             border:`1.5px solid ${form.condition===c?cc.text:C.border}`,
                             background:form.condition===c?cc.bg:C.card,
                             color:form.condition===c?cc.text:C.textSub,
                             fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {c}
                  </button>
                );})}
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div><Lbl>Narx (so'm) *</Lbl><TInput type="number" placeholder="50000" value={form.price} onChange={f("price")} /></div>
                <div>
                  <Lbl>O'lchov</Lbl>
                  <select value={form.unit} onChange={e=>f("unit")(e.target.value)}
                    style={{ width:"100%", padding:"10px 11px", borderRadius:12,
                             border:`1.5px solid ${C.border}`, fontSize:13, color:C.text,
                             fontFamily:"inherit", outline:"none", background:C.bg, marginBottom:13 }}>
                    {["dona","kg","m²","m","m³","ton"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <Lbl>Miqdori *</Lbl>
              <TInput type="number" placeholder="100" value={form.qty} onChange={f("qty")} />

              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setStep(1)}>← Orqaga</BtnGhost>
                <BtnPrimary onClick={() => canStep3 && setStep(3)} disabled={!canStep3}>Davom →</BtnPrimary>
              </div>
            </>
          )}

          {/* STEP 3 — Location */}
          {step===3 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><LocIcon size={15} color={C.primaryDark}/> Joylashuv</span></div>
              <Lbl>Viloyat / Shahar *</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                {Object.keys(UZ).map(v => (
                  <Pill key={v} active={form.viloyat===v} onClick={() => { f("viloyat")(v); f("tuman")(""); }}>{v}</Pill>
                ))}
              </div>
              {form.viloyat && (
                <>
                  <Lbl>Tuman — {form.viloyat}</Lbl>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                    {UZ[form.viloyat].map(t => (
                      <Pill key={t} active={form.tuman===t} accent onClick={() => f("tuman")(t)}>{t}</Pill>
                    ))}
                  </div>
                </>
              )}
              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setStep(2)}>← Orqaga</BtnGhost>
                <BtnPrimary onClick={() => canStep4 && setStep(4)} disabled={!canStep4}>Davom →</BtnPrimary>
              </div>
            </>
          )}

          {/* STEP 4 — Confirm */}
          {step===4 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14 }}>✅ Tasdiqlash</div>

              {/* preview card */}
              <div style={{ background:C.primaryLight, borderRadius:18, overflow:"hidden",
                            marginBottom:16, border:`1px solid ${C.primaryBorder}` }}>
                <div style={{ width:"100%", height:160, overflow:"hidden" }}>
                  <img src={form.photo} alt="preview" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
                <div style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:16, fontWeight:900, color:C.text }}>{form.name}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.primaryDark, marginTop:2 }}>
                    {form.price?parseInt(form.price).toLocaleString():0} so'm / {form.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4}}><LocIcon size={11} color={C.textSub}/> {form.viloyat}{form.tuman?` › ${form.tuman}`:""}</span>
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                {[["Kategoriya",form.category],["Holat",form.condition],
                  ["Miqdor",`${form.qty} ${form.unit}`],["Tuman",form.tuman||form.viloyat]].map(([k,v])=>(
                  <div key={k} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"9px 11px" }}>
                    <div style={{ fontSize:9, color:C.textMuted, marginBottom:1 }}>{k}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.text }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setStep(3)}>← Orqaga</BtnGhost>
                <BtnPrimary onClick={submitProd} disabled={submitting}>
                  {submitting ? "⏳ Yuklanmoqda..." : "🚀 E'lonni joylash!"}
                </BtnPrimary>
              </div>
            </>
          )}
        </Sheet>
      )}

      {/* ═══ BOTTOM NAV — 3 items ═══ */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
                    width:"100%", maxWidth:430, background:"rgba(255,255,255,0.96)",
                    backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`,
                    boxShadow:"0 -2px 14px rgba(0,0,0,0.06)",
                    display:"flex", alignItems:"center",
                    padding:"10px 0 20px", zIndex:30 }}>

        {/* Bosh sahifa */}
        <div onClick={() => onNavChange("home")}
          style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
          <div style={{ fontSize:22, lineHeight:1 }}>🏠</div>
          <div style={{ fontSize:9, marginTop:3,
                        color:C.primaryDark,
                        fontWeight:700 }}>Bosh</div>
        </div>

        {/* E'lon qo'shish — floating center */}
        <div onClick={openAdd}
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

        {/* Profil */}
        <div onClick={() => (loggedIn ? onNavChange("profile") : requireAuth())}
          style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
          <div style={{ width:30, height:30, borderRadius:"50%", margin:"0 auto",
                        overflow:"hidden",
                        border:`2.5px solid ${C.border}`,
                        background:user.avatar?"transparent":`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                        display:"flex", alignItems:"center", justifyContent:"center",
                        transition:"border-color 0.2s" }}>
            {user.avatar
              ? <img src={user.avatar} alt="av" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <span style={{ fontSize:11, fontWeight:900, color:"white" }}>
                  {user.name.split(" ").map(w=>w[0]).join("").slice(0,2)}
                </span>
            }
          </div>
          <div style={{ fontSize:9, marginTop:3,
                        color:C.textMuted,
                        fontWeight:400 }}>{loggedIn ? "Profil" : "Kirish"}</div>
        </div>
      </div>
    </div>
  );
}
