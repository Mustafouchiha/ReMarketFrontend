import { useState, useEffect, useRef } from "react";
import { Pill, BtnPrimary, BtnGhost, Sheet, Lbl, TInput } from "../components/UI";
import PCard from "../components/ProductCard";
import LocIcon from "../components/LocIcon";
import PhotoUpload from "../components/PhotoUpload";
import StepBar from "../components/StepBar";
import { C, COND, UZ, CATS, CAT_ICO, EMPTY_FORM, OPERATOR } from "../constants";
import { productsAPI, offersAPI, paymentsAPI, authAPI } from "../services/api";
import Logo from "../components/Logo";
import {
  Bell, Lock, Search, SearchX, Image as ImageIcon,
  Check, Send, User, Phone, Hash, Info,
  Loader2, CheckCircle, Clock, Package, CreditCard,
  Tag, Home, Plus, Camera, AlertCircle, Rocket,
  ChevronDown, X, ArrowLeft, ArrowRight, MapPin,
} from "lucide-react";

export default function HomePage({
  user, products, setProducts, offers, setOffers,
  onNavChange, homeAction, setHomeAction,
  onProductAdded, onDelete, isOperator = false, loggedIn, onRequireAuth,
}) {
  const [search,      setSearch]      = useState("");
  const [activeCats,  setActiveCats]  = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [showOffer,   setShowOffer]   = useState(false);
  const [showNotifs,  setShowNotifs]  = useState(false);
  const [showPayment, setShowPayment] = useState(null);
  const [cardFrom,    setCardFrom]    = useState("");
  const [note,        setNote]        = useState("");
  const [paying,      setPaying]      = useState(false);
  const [showLoc,     setShowLoc]     = useState(false);
  const [fVil,        setFVil]        = useState("");
  const [fTum,        setFTum]        = useState("");
  const [tVil,        setTVil]        = useState("");
  const [tTum,        setTTum]        = useState("");
  const [showAdd,     setShowAdd]     = useState(false);
  const [step,        setStep]        = useState(1);
  const [addImgIdx,   setAddImgIdx]   = useState(0);
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [submitting,  setSubmitting]  = useState(false);
  const [offerSending,setOfferSending]= useState(false);
  const [photoIdx,    setPhotoIdx]    = useState(0);
  const [lightbox,    setLightbox]    = useState(null);
  const [lbZoom,      setLbZoom]      = useState(1);
  const [postId,     setPostId]     = useState(null);
  const lbTouch = useRef({ count:0, startX:0, startDist:0, startZoom:1 });

  // Handle URL token and postId
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const urlPostId = urlParams.get('postId');
    
    if (token) {
      localStorage.setItem('rm_token', token);
      // Load user data
      authAPI.me().then(userData => {
        if (onNavChange) onNavChange('home');
      }).catch(err => {
        console.error('Token validation failed:', err);
      });
    }
    
    if (urlPostId) {
      setPostId(urlPostId);
    }
  }, []);

  // If postId exists, show operator post view
  if (postId) {
    const OperatorPostView = require('../OperatorPostView').default;
    return <OperatorPostView postId={postId} onClose={() => setPostId(null)} />;
  }

  const openLb  = (photos, idx) => { setLightbox({ photos, idx }); setLbZoom(1); };
  const closeLb = () => { setLightbox(null); setLbZoom(1); };
  const lbPrev  = () => setLightbox(lb => ({ ...lb, idx:(lb.idx-1+lb.photos.length)%lb.photos.length }));
  const lbNext  = () => setLightbox(lb => ({ ...lb, idx:(lb.idx+1)%lb.photos.length }));

  const lbTouchStart = (e) => {
    lbTouch.current.count = e.touches.length;
    if (e.touches.length === 1) lbTouch.current.startX = e.touches[0].clientX;
    else if (e.touches.length === 2) {
      lbTouch.current.startDist = Math.hypot(e.touches[1].clientX-e.touches[0].clientX, e.touches[1].clientY-e.touches[0].clientY);
      lbTouch.current.startZoom = lbZoom;
    }
  };
  const lbTouchMove = (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[1].clientX-e.touches[0].clientX, e.touches[1].clientY-e.touches[0].clientY);
      setLbZoom(z => Math.min(5, Math.max(1, lbTouch.current.startZoom*d/lbTouch.current.startDist)));
    }
  };
  const lbTouchEnd = (e) => {
    if (lbTouch.current.count === 1 && lbZoom <= 1.1) {
      const dx = e.changedTouches[0].clientX - lbTouch.current.startX;
      if (dx < -60) lbNext();
      else if (dx > 60) lbPrev();
    }
    lbTouch.current.count = 0;
  };

  const f = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const catOk = activeCats.length === 0 || activeCats.includes(p.category);
    return catOk
      && (!search || p.name.toLowerCase().includes(q) || (p.viloyat||"").toLowerCase().includes(q) || (p.tuman||"").toLowerCase().includes(q))
      && (!fVil || p.viloyat===fVil)
      && (!fTum || p.tuman===fTum);
  });

  const openSelected = (p) => { setSelected(p); setPhotoIdx(0); };
  const openLoc  = () => { setTVil(fVil); setTTum(fTum); setShowLoc(true); };
  const applyLoc = () => { setFVil(tVil); setFTum(tVil?tTum:""); setShowLoc(false); };
  const clearLoc = () => { setTVil(""); setTTum(""); setFVil(""); setFTum(""); setShowLoc(false); };
  const requireAuth = () => { if (onRequireAuth) onRequireAuth(); else onNavChange?.("login"); };
  const openAdd  = () => { if (!loggedIn) return requireAuth(); setForm(EMPTY_FORM); setStep(1); setAddImgIdx(0); setShowAdd(true); };
  const closeAdd = () => { setShowAdd(false); setStep(1); setForm(EMPTY_FORM); setAddImgIdx(0); };

  useEffect(() => {
    if (homeAction === "openAdd") { openAdd(); setHomeAction(null); }
  }, [homeAction]);

  const anySheetOpen = showLoc || !!selected || showOffer || showNotifs || !!showPayment || showAdd;

  const submitProd = async () => {
    if (!form.name||!form.price||!form.qty||!form.viloyat||!form.photos?.length) return;
    setSubmitting(true);
    try {
      const newProd = await productsAPI.create({
        ...form,
        photo: form.photos[0],
        photos: form.photos,
        price: parseInt(form.price),
        qty: parseInt(form.qty),
        mahalla: form.mahalla || "",
      });
      if (onProductAdded) onProductAdded(newProd);
      closeAdd();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const sendOffer = async (product) => {
    if (!loggedIn) return requireAuth();
    setOfferSending(true);
    try {
      await offersAPI.send(product.id);
      setShowOffer(false); setSelected(null);
    } catch (e) { alert(e.message); }
    finally { setOfferSending(false); }
  };

  const confirmPayment = async (offerId) => {
    setPaying(true);
    try {
      await paymentsAPI.send({ offerId, cardFrom, note });
      const result = await paymentsAPI.confirm(offerId);
      // Remove product from feed immediately
      if (result.productId) {
        setProducts(prev => prev.filter(p => p.id !== result.productId));
      }
      setOffers(prev => prev.map(o => o.id===offerId ? { ...o, status:"paid" } : o));
      setShowPayment(null);
      setCardFrom(""); setNote("");
    } catch (e) {
      alert(e.message);
    } finally {
      setPaying(false);
    }
  };

  const myNotifs    = offers;
  const unreadCount = myNotifs.filter(o => o.status==="pending").length;
  const isLocOn  = !!fVil;
  const locLabel = fVil ? (fTum||fVil) : "Joylashuv";
  const canStep2 = form.photos?.length > 0;
  const canStep3 = form.name && form.price && form.qty;
  const canStep4 = !!form.viloyat;

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
                  minHeight:"100vh", paddingBottom:84, maxWidth:430,
                  margin:"0 auto", position:"relative",
                  overflowY:anySheetOpen?"hidden":"auto",
                  height:anySheetOpen?"100vh":"auto" }}>

      <div style={{ position:"fixed", top:-100, right:-80, width:280, height:280, borderRadius:"50%",
                    background:"radial-gradient(circle,rgba(255,179,128,0.12) 0%,transparent 70%)",
                    pointerEvents:"none", zIndex:0 }} />

      {/* HEADER */}
      <div style={{ padding:"16px 16px 12px", background:"rgba(255,255,255,0.93)",
                    backdropFilter:"blur(14px)", position:"sticky", top:0, zIndex:20,
                    borderBottom:`1px solid ${C.border}`, boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:7 }}>
              <Logo size={32} />
              <span style={{ fontSize:20, fontWeight:900, color:C.text, letterSpacing:"-0.4px" }}>ReQurilish</span>
            </div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>Qayta ishlangan qurilish materiallari</div>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
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
              <ChevronDown size={11} style={{ flexShrink:0 }} />
            </button>

            {loggedIn ? (
              <div style={{ position:"relative", cursor:"pointer" }} onClick={() => setShowNotifs(true)}>
                <div style={{ width:40, height:40, borderRadius:12,
                              background: unreadCount>0 ? C.primaryLight : C.bg,
                              border:`1.5px solid ${unreadCount>0 ? C.primaryBorder : C.border}`,
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Bell size={18} color={unreadCount>0 ? C.primaryDark : C.textSub} />
                </div>
                {unreadCount > 0 && (
                  <div style={{ position:"absolute", top:-4, right:-4, width:18, height:18,
                                background:C.primaryDark, borderRadius:"50%", fontSize:9,
                                color:"white", fontWeight:800, border:"2px solid white",
                                display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {unreadCount}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ cursor:"pointer" }} onClick={requireAuth}>
                <div style={{ width:40, height:40, borderRadius:12,
                              background:C.bg, border:`1.5px solid ${C.border}`,
                              display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Lock size={18} color={C.textSub} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position:"relative" }}>
          <Search size={14} style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", opacity:0.4 }} />
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

      {/* Category pills */}
      <div style={{ padding:"10px 16px", display:"flex", flexWrap:"wrap", gap:7 }}>
        {CATS.map(cat => {
          if (cat === "Barchasi") return <Pill key={cat} active={activeCats.length===0} onClick={() => setActiveCats([])}>Barchasi</Pill>;
          const isActive = activeCats.includes(cat);
          return (
            <Pill key={cat} active={isActive} onClick={() => setActiveCats(prev =>
              prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat])}>
              {cat}
            </Pill>
          );
        })}
      </div>

      {isLocOn && (
        <div style={{ padding:"0 16px 8px" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:5,
                        background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                        borderRadius:20, padding:"4px 12px",
                        fontSize:11, color:C.primaryDark, fontWeight:700 }}>
            <LocIcon size={11} color={C.primaryDark}/> {fVil}{fTum?` › ${fTum}`:""}
            <X size={11} onClick={clearLoc} style={{ cursor:"pointer", opacity:0.65 }} />
          </div>
        </div>
      )}

      <div style={{ padding:"2px 16px 12px" }}>
        <span style={{ fontSize:11, color:C.textMuted, fontWeight:600 }}>{filtered.length} ta mahsulot</span>
      </div>

      {/* Product grid */}
      <div style={{ padding:"0 16px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        {filtered.map(p => <PCard key={p.id} p={p} isOwn={loggedIn && p.ownerId===user.id} onClick={() => openSelected(p)} />)}
      </div>

      {filtered.length===0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.textMuted }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
            <SearchX size={44} color={C.textMuted} style={{ opacity:0.5 }} />
          </div>
          <div style={{ fontSize:14, fontWeight:700 }}>Hech narsa topilmadi</div>
          <div style={{ fontSize:11, marginTop:4 }}>Filtr yoki qidiruvni o'zgartiring</div>
        </div>
      )}

      {/* LOCATION SHEET */}
      {showLoc && (
        <Sheet onClose={() => setShowLoc(false)}>
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:14 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
              <LocIcon size={15} color={C.primaryDark}/> Joylashuv filtri
            </span>
          </div>
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
            <BtnGhost onClick={clearLoc}>Tozalash</BtnGhost>
            <BtnPrimary onClick={applyLoc}><Check size={14} /> Qo'llash</BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* PRODUCT DETAIL SHEET */}
      {selected && (() => {
        const selPhotos = (selected.photos?.length ? selected.photos : (selected.photo ? [selected.photo] : []));
        const hasManyPhotos = selPhotos.length > 1;
        return (
          <Sheet onClose={() => setSelected(null)} maxH="80vh">
            <div style={{ position:"relative", width:"100%", height:200, borderRadius:18, overflow:"hidden",
                          background:C.primaryLight, marginBottom:16,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              {selPhotos.length > 0
                ? <img src={selPhotos[photoIdx]} alt={selected.name}
                    onClick={() => openLb(selPhotos, photoIdx)}
                    style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"zoom-in" }} />
                : <ImageIcon size={56} color={C.primaryBorder} style={{ opacity:0.4 }} />
              }
              {hasManyPhotos && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i-1+selPhotos.length)%selPhotos.length)}
                    style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)",
                             width:32, height:32, borderRadius:"50%", border:"none",
                             background:"rgba(0,0,0,0.45)", color:"white", cursor:"pointer",
                             display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>‹</button>
                  <button onClick={() => setPhotoIdx(i => (i+1)%selPhotos.length)}
                    style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                             width:32, height:32, borderRadius:"50%", border:"none",
                             background:"rgba(0,0,0,0.45)", color:"white", cursor:"pointer",
                             display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>›</button>
                  <div style={{ position:"absolute", bottom:8, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
                    {selPhotos.map((_, i) => (
                      <div key={i} onClick={() => setPhotoIdx(i)}
                        style={{ width:i===photoIdx?18:6, height:6, borderRadius:3,
                                 background:i===photoIdx?"white":"rgba(255,255,255,0.5)",
                                 cursor:"pointer", transition:"all 0.2s" }} />
                    ))}
                  </div>
                  <div style={{ position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.45)", color:"white",
                                fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:10 }}>
                    {photoIdx+1}/{selPhotos.length}
                  </div>
                </>
              )}
            </div>

            <div style={{ fontSize:19, fontWeight:900, color:C.text, marginBottom:8 }}>{selected.name}</div>

            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, color:C.textMuted, marginBottom:4 }}>Manzil</div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"6px 10px", borderRadius:10,
                            background:C.bg, border:`1px solid ${C.border}` }}>
                <LocIcon size={14} color={C.primaryDark} />
                <span style={{ fontSize:13, fontWeight:700, color:C.text }}>
                  {selected.viloyat}{selected.tuman?` › ${selected.tuman}`:""}{selected.mahalla?` › ${selected.mahalla}`:""}
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
              {[
                [CreditCard, "Narx",  `${selected.price.toLocaleString()} so'm/${selected.unit}`],
                [Package,    "Miqdor",`${selected.qty} ${selected.unit}`],
                [Tag,        "Toifa", selected.category],
              ].map(([Icon,l,v]) => (
                <div key={l} style={{ background:C.bg, borderRadius:12, padding:"10px 7px",
                                      textAlign:"center", border:`1px solid ${C.border}` }}>
                  <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>
                    <Icon size={14} color={C.primaryDark} />
                  </div>
                  <div style={{ fontSize:9, color:C.textMuted, marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:10, fontWeight:700, color:C.text }}>{v}</div>
                </div>
              ))}
            </div>

            {selected.ownerId === user.id ? (
              <div style={{ background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                            borderRadius:14, padding:"12px 16px", textAlign:"center" }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.primaryDark }}>Bu sizning e'loningiz</div>
              </div>
            ) : (
              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setSelected(null)}>Yopish</BtnGhost>
                <BtnPrimary onClick={() => { if (!loggedIn) return requireAuth(); setShowOffer(selected); }}>
                  <Send size={15} /> Taklif yuborish
                </BtnPrimary>
              </div>
            )}

            {selected.ownerId === user.id && (
              <div style={{ marginTop:10, display:"flex", justifyContent:"center" }}>
                <BtnGhost onClick={() => setSelected(null)}>Yopish</BtnGhost>
              </div>
            )}
          </Sheet>
        );
      })()}

      {/* OFFER SHEET */}
      {showOffer && (
        <Sheet onClose={() => setShowOffer(false)} maxH="72vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6,
                        display:"flex", alignItems:"center", gap:7 }}>
            <Send size={16} color={C.primaryDark} /> Taklif yuborish
          </div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:18 }}>
            Taklif yuborildi. Sotuvchi 5% to'lovni qilgandan keyin ma'lumotlar ochiladi.
          </div>

          <div style={{ display:"flex", gap:12, alignItems:"center", background:C.primaryLight,
                        borderRadius:14, padding:"10px 13px", marginBottom:16,
                        border:`1px solid ${C.primaryBorder}` }}>
            <div style={{ width:52, height:52, borderRadius:12, overflow:"hidden", flexShrink:0, background:C.bg,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              {showOffer.photo
                ? <img src={showOffer.photo} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <ImageIcon size={24} color={C.primaryBorder} style={{ opacity:0.5 }} />
              }
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:800, color:C.text }}>{showOffer.name}</div>
              <div style={{ fontSize:12, color:C.primaryDark, fontWeight:700 }}>
                {showOffer.price?.toLocaleString()} so'm/{showOffer.unit}
              </div>
              <div style={{ fontSize:10, color:C.textMuted }}>ID: #{showOffer.publicId || showOffer.id}</div>
            </div>
          </div>

          <div style={{ background:C.bg, borderRadius:14, padding:"12px 14px",
                        marginBottom:16, border:`1px solid ${C.border}` }}>
            <div style={{ fontSize:11, fontWeight:800, color:C.textSub, marginBottom:10, textTransform:"uppercase", letterSpacing:0.5 }}>
              Sizning ma'lumotlaringiz
            </div>
            {[
              [User,  "Ism",     user.name],
              [Phone, "Telefon", user.phone],
              [Send,  "Telegram",user.telegram||"@noma'lum"],
              [Hash,  "ID",      `#${showOffer.publicId || showOffer.id}`],
            ].map(([Icon,l,v]) => (
              <div key={l} style={{ display:"flex", justifyContent:"space-between",
                                    padding:"6px 0", borderBottom:`1px solid ${C.border}` }}>
                <span style={{ fontSize:12, color:C.textSub, display:"inline-flex", alignItems:"center", gap:5 }}>
                  <Icon size={12} /> {l}
                </span>
                <span style={{ fontSize:12, fontWeight:700, color:C.text }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{ fontSize:11, color:C.textMuted, marginBottom:16, lineHeight:1.6,
                        background:"#FFFBEB", borderRadius:12, padding:"10px 13px",
                        border:"1px solid #FDE68A",
                        display:"flex", alignItems:"flex-start", gap:7 }}>
            <Info size={14} color="#D97706" style={{ flexShrink:0, marginTop:1 }} />
            Taklif yuborgandan so'ng mahsulot egasi (sotuvchi) narxining 5% to'lovini operator orqali qiladi. To'lovdan keyin bot orqali sotuvchining telefon/telegram/ismi sizga ochiladi.
          </div>

          <div style={{ display:"flex", gap:9 }}>
            <BtnGhost onClick={() => setShowOffer(false)}>Bekor</BtnGhost>
            <BtnPrimary onClick={() => sendOffer(showOffer)} disabled={offerSending}>
              {offerSending
                ? <><Loader2 size={15} className="spin" /> Yuborilmoqda...</>
                : <><Send size={15} /> Taklif yuborish</>
              }
            </BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* NOTIFICATIONS SHEET */}
      {showNotifs && (
        <Sheet onClose={() => setShowNotifs(false)} maxH="85vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:18,
                        display:"flex", alignItems:"center", gap:7 }}>
            <Bell size={16} color={C.primaryDark} /> Xabarnomalar
            {myNotifs.length>0 && (
              <span style={{ fontSize:12, color:C.textMuted, fontWeight:500 }}>({myNotifs.length} ta)</span>
            )}
          </div>

          {myNotifs.length===0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:C.textMuted }}>
              <div style={{ display:"flex", justifyContent:"center", marginBottom:10 }}>
                <Bell size={44} color={C.textMuted} style={{ opacity:0.3 }} />
              </div>
              <div style={{ fontSize:13, fontWeight:700 }}>Hali xabarnoma yo'q</div>
              <div style={{ fontSize:11, marginTop:4 }}>E'lonlaringizga taklif kelganda bu yerda ko'rinadi</div>
            </div>
          ) : (
            myNotifs.map(o => (
              <div key={o.id} style={{ background:C.bg, borderRadius:16, padding:"13px 14px",
                                       marginBottom:10, border:`1px solid ${o.status==="paid"?C.primaryBorder:C.border}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontSize:10, fontWeight:800, padding:"2px 8px", borderRadius:8,
                                 background: o.status==="paid" ? "#E8F8F0" : "#FFF8E6",
                                 color: o.status==="paid" ? "#28A869" : "#D4920A",
                                 display:"inline-flex", alignItems:"center", gap:4 }}>
                    {o.status==="paid"
                      ? <><CheckCircle size={10} /> To'landi</>
                      : <><Clock size={10} /> Kutilmoqda</>
                    }
                  </span>
                  <span style={{ fontSize:9, color:C.textMuted }}>
                    {new Date(o.sentAt).toLocaleDateString("uz-UZ")}
                  </span>
                </div>

                <div style={{ fontSize:12, fontWeight:700, color:C.text, marginBottom:2,
                              display:"flex", alignItems:"center", gap:5 }}>
                  <Package size={12} color={C.textSub} /> {o.productName}
                  <span style={{ color:C.textMuted, fontWeight:500 }}>(ID: #{o.productPublicId || o.productId})</span>
                </div>

                <div style={{ fontSize:11, color:C.textSub, marginBottom:10,
                              display:"flex", alignItems:"center", gap:5 }}>
                  <User size={11} /> Xaridor (ID: <b>{o.buyerPublicId || "—"}</b>)
                </div>

                {/* NO delete button — auto handled by backend */}
                {o.status==="paid" ? (
                  <div style={{ padding:"10px", borderRadius:12,
                                background:"#E8F8F0", color:"#28A869",
                                fontSize:12, fontWeight:900, textAlign:"center" }}>
                    ✅ To'lov qilingan — mahsulot sotildi
                  </div>
                ) : (
                  <button
                    onClick={() => { setShowPayment(o); setCardFrom(""); setNote(""); setShowNotifs(false); }}
                    style={{ width:"100%", padding:"10px 12px", borderRadius:12,
                              background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                              border:"none", color:"white", fontSize:12, fontWeight:900,
                              cursor:"pointer", fontFamily:"inherit" }}>
                    💳 5% to'lovni yuborish va tasdiqlash
                  </button>
                )}
              </div>
            ))
          )}
        </Sheet>
      )}

      {/* PAYMENT SHEET */}
      {showPayment && (
        <Sheet onClose={() => setShowPayment(null)} maxH="80vh">
          <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:18,
                        display:"flex", alignItems:"center", gap:7 }}>
            <CreditCard size={16} color={C.primaryDark} /> To'lov ma'lumoti
          </div>

          <div style={{ background:C.primaryLight, borderRadius:16, padding:"14px 16px",
                        marginBottom:14, border:`1px solid ${C.primaryBorder}` }}>
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

          <div style={{ background:"#1C1C1E", borderRadius:16, padding:"16px", marginBottom:14 }}>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.5)", marginBottom:6, textTransform:"uppercase", letterSpacing:0.5 }}>Operator karta</div>
            <div style={{ fontSize:20, fontWeight:900, color:"white", letterSpacing:2, marginBottom:8 }}>{OPERATOR.card}</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)" }}>{OPERATOR.name}</div>
          </div>

          <div style={{ background:"#E8F4FD", borderRadius:14, padding:"12px 14px",
                        marginBottom:14, border:"1px solid #BFDBF7",
                        display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"#0088CC",
                          display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Send size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize:11, color:"#0088CC", fontWeight:700 }}>Operator Telegram</div>
              <div style={{ fontSize:15, fontWeight:900, color:"#005580" }}>{OPERATOR.telegram}</div>
              <div style={{ fontSize:10, color:"#6B7280", marginTop:2 }}>Chekni shu manzilga yuboring</div>
            </div>
          </div>

          <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.7, marginBottom:18,
                        background:"#FFFBEB", borderRadius:12, padding:"10px 13px", border:"1px solid #FDE68A" }}>
            1. Yuqoridagi kartaga <b>{Math.round(showPayment.productPrice * 0.05).toLocaleString()} so'm</b> o'tkazing<br/>
            2. To'lov chekini <b>{OPERATOR.telegram}</b> ga yuboring<br/>
            3. Siz tasdiqlagandan keyin bot xaridorga sotuvchining kontaktlarini ochadi
          </div>

          <div style={{ marginBottom:12 }}>
            <Lbl>Sizning karta raqamingiz (ixtiyoriy)</Lbl>
            <TInput value={cardFrom} onChange={(v) => setCardFrom(v)} placeholder="8600 0000 0000 0000" />
          </div>
          <div style={{ marginBottom:18 }}>
            <Lbl>Izoh (ixtiyoriy)</Lbl>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              placeholder="To'lov haqida qo'shimcha ma'lumot..." rows={2}
              style={{ width:"100%", boxSizing:"border-box", border:`1.5px solid ${C.border}`,
                       borderRadius:12, padding:"10px 14px", fontSize:13, resize:"none",
                       outline:"none", background:C.bg, fontFamily:"inherit" }} />
          </div>

          <div style={{ display:"flex", gap:9 }}>
            <BtnGhost onClick={() => setShowPayment(null)}>Yopish</BtnGhost>
            <BtnPrimary onClick={() => confirmPayment(showPayment.id)} disabled={paying}>
              <Check size={15} /> {paying ? "⏳ Yuborilmoqda..." : "To'lov yuborildi va tasdiqlash"}
            </BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* ADD PRODUCT SHEET */}
      {showAdd && (
        <Sheet onClose={closeAdd} maxH="92vh">
          <StepBar current={step} />

          {/* STEP 1 — Photo */}
          {step===1 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14,
                            display:"flex", alignItems:"center", gap:7 }}>
                <Camera size={16} color={C.primaryDark} /> Mahsulot rasmi
                <span style={{ fontSize:11, color:C.danger }}>*</span>
              </div>
              <PhotoUpload photos={form.photos} onPhotos={f("photos")} required />
              {!form.photos?.length && (
                <div style={{ fontSize:11, color:C.danger, marginBottom:12, fontWeight:600,
                              display:"flex", alignItems:"center", gap:5 }}>
                  <AlertCircle size={13} /> Rasm yuklash majburiy
                </div>
              )}
              <BtnPrimary onClick={() => canStep2 && setStep(2)} disabled={!canStep2} fullWidth>
                Davom etish <ArrowRight size={15} />
              </BtnPrimary>
            </>
          )}

          {/* STEP 2 — Details */}
          {step===2 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14,
                            display:"flex", alignItems:"center", gap:7 }}>
                <Package size={16} color={C.primaryDark} /> Mahsulot ma'lumoti
              </div>

              <div style={{ display:"flex", gap:10, alignItems:"center", marginBottom:16,
                            background:C.primaryLight, borderRadius:14, padding:"10px 12px",
                            border:`1px solid ${C.primaryBorder}` }}>
                <div style={{ width:52, height:52, borderRadius:10, overflow:"hidden", flexShrink:0 }}>
                  <img src={form.photos[0]} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                </div>
                <div style={{ fontSize:11, color:C.textSub, fontWeight:600 }}>
                  <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                    <CheckCircle size={12} color="#28A869" /> Rasm yuklandi
                  </span>
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
                <div><Lbl>Miqdori *</Lbl><TInput type="number" min="0" placeholder="100" value={form.qty} onChange={f("qty")} /></div>
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

              <Lbl>Narx (so'm) *</Lbl>
              <TInput type="number" min="0" placeholder="50000" value={form.price} onChange={f("price")} />

              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setStep(1)}><ArrowLeft size={14} /> Orqaga</BtnGhost>
                <BtnPrimary onClick={() => canStep3 && setStep(3)} disabled={!canStep3}>
                  Davom <ArrowRight size={14} />
                </BtnPrimary>
              </div>
            </>
          )}

          {/* STEP 3 — Location + Mahalla */}
          {step===3 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <LocIcon size={15} color={C.primaryDark}/> Joylashuv
                </span>
              </div>
              <Lbl>Viloyat / Shahar *</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:14 }}>
                {Object.keys(UZ).map(v => (
                  <Pill key={v} active={form.viloyat===v} onClick={() => { f("viloyat")(v); f("tuman")(""); f("mahalla")(""); }}>{v}</Pill>
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
              <Lbl>Mahalla (ixtiyoriy)</Lbl>
              <TInput
                placeholder="Mahalla nomi"
                value={form.mahalla || ""}
                onChange={f("mahalla")}
              />
              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setStep(2)}><ArrowLeft size={14} /> Orqaga</BtnGhost>
                <BtnPrimary onClick={() => canStep4 && setStep(4)} disabled={!canStep4}>
                  Davom <ArrowRight size={14} />
                </BtnPrimary>
              </div>
            </>
          )}

          {/* STEP 4 — Confirm */}
          {step===4 && (
            <>
              <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:14,
                            display:"flex", alignItems:"center", gap:7 }}>
                <CheckCircle size={16} color={C.primaryDark} /> Tasdiqlash
              </div>

              {/* Pending notice */}
              <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:14,
                            padding:"12px 14px", marginBottom:14,
                            display:"flex", alignItems:"center", gap:8 }}>
                <Clock size={16} color="#D97706" style={{ flexShrink:0 }} />
                <div style={{ fontSize:12, color:"#92400E" }}>
                  <b>Diqqat:</b> E'lon qo'shilgandan keyin operator tekshiradi (30-60 daqiqa). Tasdiqlangach barchaga ko'rinadi.
                </div>
              </div>

              <div style={{ background:C.primaryLight, borderRadius:18, overflow:"hidden",
                            marginBottom:16, border:`1px solid ${C.primaryBorder}` }}>
                <div style={{ position:"relative", width:"100%", height:180, overflow:"hidden", background:"#000" }}>
                  <img src={form.photos[addImgIdx]} alt="preview"
                    style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                  {form.photos.length > 1 && (<>
                    <button onClick={() => setAddImgIdx(i => (i-1+form.photos.length)%form.photos.length)}
                      style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)",
                               width:28, height:28, borderRadius:"50%", border:"none",
                               background:"rgba(0,0,0,0.45)", color:"white", fontSize:16,
                               cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                    <button onClick={() => setAddImgIdx(i => (i+1)%form.photos.length)}
                      style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)",
                               width:28, height:28, borderRadius:"50%", border:"none",
                               background:"rgba(0,0,0,0.45)", color:"white", fontSize:16,
                               cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                    <div style={{ position:"absolute", bottom:8, left:0, right:0,
                                  display:"flex", justifyContent:"center", alignItems:"center", gap:5 }}>
                      {form.photos.map((_, i) => (
                        <div key={i} onClick={() => setAddImgIdx(i)}
                          style={{ width:i===addImgIdx?18:6, height:6, borderRadius:3,
                                   background:i===addImgIdx?"white":"rgba(255,255,255,0.5)",
                                   transition:"width 0.2s", cursor:"pointer" }} />
                      ))}
                    </div>
                    <div style={{ position:"absolute", top:8, right:10, fontSize:11, fontWeight:700,
                                  color:"white", background:"rgba(0,0,0,0.45)", padding:"2px 7px", borderRadius:10 }}>
                      {addImgIdx+1}/{form.photos.length}
                    </div>
                  </>)}
                </div>

                <div style={{ padding:"12px 14px" }}>
                  <div style={{ fontSize:16, fontWeight:900, color:C.text }}>{form.name}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.primaryDark, marginTop:2 }}>
                    {form.price?parseInt(form.price).toLocaleString():0} so'm / {form.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub, marginTop:2 }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
                      <LocIcon size={11} color={C.textSub}/>
                      {form.viloyat}{form.tuman?` › ${form.tuman}`:""}
                      {form.mahalla?` › ${form.mahalla}`:""}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:16 }}>
                {[["Kategoriya",form.category],["Holat",form.condition],
                  ["Miqdor",`${form.qty} ${form.unit}`],
                  ["Mahalla",form.mahalla||form.tuman||form.viloyat]].map(([k,v])=>(
                  <div key={k} style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"9px 11px" }}>
                    <div style={{ fontSize:9, color:C.textMuted, marginBottom:1 }}>{k}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:C.text }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ display:"flex", gap:9 }}>
                <BtnGhost onClick={() => setStep(3)}><ArrowLeft size={14} /> Orqaga</BtnGhost>
                <BtnPrimary onClick={submitProd} disabled={submitting}>
                  {submitting
                    ? <><Loader2 size={15} className="spin" /> Yuklanmoqda...</>
                    : <><Rocket size={15} /> E'lonni joylash!</>
                  }
                </BtnPrimary>
              </div>
            </>
          )}
        </Sheet>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={{ position:"fixed", inset:0, background:"black", zIndex:500,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      userSelect:"none", touchAction:"none" }}
          onTouchStart={lbTouchStart} onTouchMove={lbTouchMove} onTouchEnd={lbTouchEnd}>
          <button onClick={closeLb}
            style={{ position:"absolute", top:16, right:16, width:40, height:40,
                     borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.18)",
                     color:"white", cursor:"pointer", zIndex:6,
                     display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={20} />
          </button>
          {lightbox.photos.length > 1 && (
            <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)",
                          color:"rgba(255,255,255,0.85)", fontSize:12, fontWeight:700,
                          background:"rgba(0,0,0,0.45)", padding:"3px 12px", borderRadius:20, zIndex:6 }}>
              {lightbox.idx+1} / {lightbox.photos.length}
            </div>
          )}
          <img src={lightbox.photos[lightbox.idx]} alt=""
            onDoubleClick={() => setLbZoom(z => z>1?1:2.5)}
            style={{ maxWidth:"100%", maxHeight:"100dvh", objectFit:"contain",
                     transform:`scale(${lbZoom})`, transformOrigin:"center",
                     transition:"transform 0.2s" }} />
          {lightbox.photos.length > 1 && (
            <>
              <button onClick={lbPrev}
                style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
                         width:44, height:44, borderRadius:"50%", border:"none",
                         background:"rgba(255,255,255,0.18)", color:"white", cursor:"pointer",
                         fontSize:26, display:"flex", alignItems:"center", justifyContent:"center", zIndex:6 }}>‹</button>
              <button onClick={lbNext}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)",
                         width:44, height:44, borderRadius:"50%", border:"none",
                         background:"rgba(255,255,255,0.18)", color:"white", cursor:"pointer",
                         fontSize:26, display:"flex", alignItems:"center", justifyContent:"center", zIndex:6 }}>›</button>
            </>
          )}
        </div>
      )}

      {/* Guest bottom nav */}
      {!loggedIn && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
                      width:"100%", maxWidth:430, background:"rgba(255,255,255,0.96)",
                      backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`,
                      boxShadow:"0 -2px 14px rgba(0,0,0,0.06)",
                      display:"flex", alignItems:"center", padding:"10px 0 20px", zIndex:30 }}>
          <div onClick={() => onNavChange("home")} style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
            <div style={{ display:"flex", justifyContent:"center" }}>
              <Home size={22} color={C.primaryDark} />
            </div>
            <div style={{ fontSize:9, marginTop:3, color:C.primaryDark, fontWeight:700 }}>Bosh</div>
          </div>
          <div onClick={openAdd} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer" }}>
            <div style={{ width:52, height:52, borderRadius:17,
                          background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          marginTop:-24, boxShadow:`0 6px 20px rgba(255,179,128,0.6)`,
                          border:"3px solid white" }}>
              <Plus size={26} color="white" strokeWidth={2.5} />
            </div>
            <div style={{ fontSize:9, marginTop:4, color:C.textMuted, fontWeight:400 }}>E'lon</div>
          </div>
          <div onClick={requireAuth} style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
            <div style={{ width:30, height:30, borderRadius:"50%", margin:"0 auto",
                          overflow:"hidden", border:`2.5px solid ${C.border}`,
                          background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:11, fontWeight:900, color:"white" }}>?</span>
            </div>
            <div style={{ fontSize:9, marginTop:3, color:C.textMuted, fontWeight:400 }}>Kirish</div>
          </div>
        </div>
      )}
    </div>
  );
}