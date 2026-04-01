import { useState } from "react";
import { Lbl, TInput, BtnPrimary, BtnGhost } from "../components/UI";
import AvatarUpload from "../components/AvatarUpload";
import LocIcon from "../components/LocIcon";
import PaymentPage from "./PaymentPage";
import { C, COND } from "../constants";
import { authAPI } from "../services/api";
import {
  Package, Calendar, Inbox, Trash2,
  Pencil, Check, LogOut, Lock, CreditCard,
} from "lucide-react";

// ─── PROFILE SCREEN ───────────────────────────────────────────────
export default function ProfilePage({ user, setUser, myProducts, onDelete, onLogout }) {
  const [editMode,  setEditMode]  = useState(false);
  const [draft,     setDraft]     = useState({ name: user.name, avatar: user.avatar });
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "payment"

  const save = async () => {
    setSaving(true);
    try {
      const updated = await authAPI.updateMe({ name: draft.name, avatar: draft.avatar });
      setUser(updated);
    } catch { /* silent */ }
    setSaving(false);
    setEditMode(false);
  };
  const cancel = () => { setDraft({ name: user.name, avatar: user.avatar }); setEditMode(false); };

  return (
    <div style={{ padding:"20px 16px 10px", overflowY:"auto", fontFamily:"'Nunito','Segoe UI',sans-serif",
                  background:C.bg, minHeight:"100vh", paddingBottom:84,
                  maxWidth:430, margin:"0 auto", position:"relative" }}>

      {/* Tab: Profil | To'lovlar */}
      <div style={{ display:"flex", background:C.card, borderRadius:16, padding:4,
                    marginBottom:18, gap:4, border:`1px solid ${C.border}` }}>
        {[["profile","👤 Profil"],["payment","💳 To'lovlar"]].map(([tab, lbl]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex:1, padding:"9px 0", borderRadius:12, border:"none",
            cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700, transition:"all .2s",
            background: activeTab===tab ? C.primaryDark : "transparent",
            color: activeTab===tab ? "white" : C.textMuted,
          }}>{lbl}</button>
        ))}
      </div>

      {/* To'lovlar tab */}
      {activeTab === "payment" && <PaymentPage user={user} embedded />}

      {/* ── Profile content ── */}
      {activeTab === "profile" && <>

      {/* ── Profile card ── */}
      <div style={{ background:C.card, borderRadius:22, padding:"24px 18px 20px",
                    border:`1px solid ${C.border}`, boxShadow:C.shadow,
                    marginBottom:16, textAlign:"center" }}>
        <AvatarUpload
          avatar={draft.avatar} name={draft.name}
          onAvatar={v => setDraft(d => ({ ...d, avatar: v }))}
        />

        {editMode ? (
          <div style={{ textAlign:"left" }}>
            <Lbl>Ism Familiya</Lbl>
            <TInput value={draft.name} onChange={v => setDraft(d => ({ ...d, name: v }))} placeholder="Ism Familiya" />

            {/* Telefon — o'zgartirish mumkin emas */}
            <Lbl>Telefon</Lbl>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
                          borderRadius:12, border:`1.5px solid ${C.border}`, background:"#F9F9F9",
                          marginBottom:13, color:C.textMuted, fontSize:14 }}>
              <Lock size={13} color={C.textMuted} />
              +998 {user.phone}
            </div>

            {/* Telegram — o'zgartirish mumkin emas */}
            <Lbl>Telegram</Lbl>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 13px",
                          borderRadius:12, border:`1.5px solid ${C.border}`, background:"#F9F9F9",
                          marginBottom:13, color:C.textMuted, fontSize:14 }}>
              <Lock size={13} color={C.textMuted} />
              {user.telegram || "Bog'lanmagan"}
            </div>

            <div style={{ display:"flex", gap:9, marginTop:4 }}>
              <BtnGhost onClick={cancel}>Bekor</BtnGhost>
              <BtnPrimary onClick={save} disabled={saving}>
                <Check size={15} /> {saving ? "Saqlanmoqda..." : "Saqlash"}
              </BtnPrimary>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:3 }}>{user.name}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:3 }}>+998 {user.phone}</div>
            {user.telegram && (
              <div style={{ fontSize:11, color:"#0088CC", marginBottom:12 }}>{user.telegram}</div>
            )}
            <button onClick={() => { setDraft({ name: user.name, avatar: user.avatar }); setEditMode(true); }}
              style={{ padding:"8px 22px", borderRadius:20, border:`1.5px solid ${C.primaryBorder}`,
                       background:C.primaryLight, color:C.primaryDark, fontSize:12,
                       fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                       display:"inline-flex", alignItems:"center", gap:6 }}>
              <Pencil size={13} /> Tahrirlash
            </button>
          </>
        )}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[
          [Package,  myProducts.length,                     "E'lonlarim"],
          [Calendar, new Date(user.joined).getFullYear(),   "A'zo yili"],
        ].map(([Icon, v, l]) => (
          <div key={l} style={{ background:C.card, borderRadius:16, padding:"14px 10px",
                                textAlign:"center", border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:4 }}>
              <Icon size={22} color={C.primaryDark} />
            </div>
            <div style={{ fontSize:22, fontWeight:900, color:C.primaryDark }}>{v}</div>
            <div style={{ fontSize:10, color:C.textMuted }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── My listings ── */}
      <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:14, fontWeight:800, color:C.text, marginBottom:12 }}>
        <Package size={16} color={C.primaryDark} /> Mening e'lonlarim
      </div>

      {myProducts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 20px", color:C.textMuted,
                      background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
          <div style={{ display:"flex", justifyContent:"center", marginBottom:8 }}>
            <Inbox size={38} color={C.textMuted} />
          </div>
          <div style={{ fontSize:13, fontWeight:700 }}>Hali e'lonlar yo'q</div>
          <div style={{ fontSize:11, marginTop:3 }}>E'lon qo'shish uchun + tugmasini bosing</div>
        </div>
      ) : (
        myProducts.map(p => {
          const cc = COND[p.condition];
          return (
            <div key={p.id}
              style={{ background:C.card, borderRadius:16, marginBottom:10,
                       border:`1px solid ${C.border}`, boxShadow:C.shadow,
                       display:"flex", overflow:"hidden", alignItems:"stretch" }}>
              <div style={{ width:80, flexShrink:0, background:C.primaryLight,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                {p.photo
                  ? <img src={p.photo} alt={p.name} style={{ width:80, height:"100%", objectFit:"cover" }} />
                  : <Package size={28} color={C.primaryBorder} />
                }
              </div>
              <div style={{ flex:1, padding:"10px 12px", minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden",
                              textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{p.name}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.primaryDark, marginBottom:4 }}>
                  {p.price.toLocaleString()} so'm/{p.unit}
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:7,
                                 background:cc.bg, color:cc.text }}>● {p.condition}</span>
                  <span style={{ fontSize:9, color:C.textMuted, display:"inline-flex", alignItems:"center", gap:2 }}>
                    <LocIcon size={9} color={C.textMuted}/> {p.tuman||p.viloyat}
                  </span>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", padding:"0 12px" }}>
                <button onClick={() => onDelete(p.id)}
                  style={{ width:34, height:34, borderRadius:10, border:"none",
                           background:C.dangerLight, color:C.danger,
                           cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* ── Logout ── */}
      <button onClick={onLogout}
        style={{ width:"100%", padding:"13px", borderRadius:14, marginTop:16,
                 border:`1.5px solid #FFD4D4`, background:C.dangerLight,
                 color:C.danger, fontSize:13, fontWeight:700,
                 cursor:"pointer", fontFamily:"inherit",
                 display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <LogOut size={16} /> Chiqish (Logout)
      </button>
      <div style={{ height:16 }} />

      </> /* end activeTab === "profile" */}
    </div>
  );
}
