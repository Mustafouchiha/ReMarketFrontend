import { useState } from "react";
import { Lbl, TInput, BtnPrimary, BtnGhost } from "../components/UI";
import AvatarUpload from "../components/AvatarUpload";
import LocIcon from "../components/LocIcon";
import { C, COND } from "../constants";

// ─── PROFILE SCREEN ───────────────────────────────────────────────
export default function ProfilePage({ user, setUser, myProducts, onDelete, onLogout }) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft]       = useState({ ...user });

  const save = () => { setUser({ ...draft }); setEditMode(false); };
  const cancel = () => { setDraft({ ...user }); setEditMode(false); };

  return (
    <div style={{ padding:"20px 16px 10px", overflowY:"auto" , fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
      minHeight:"100vh", paddingBottom:84, maxWidth:430,
      margin:"0 auto", position:"relative" }}>

      {/* ── Profile card ── */}
      <div style={{ background:C.card, borderRadius:22, padding:"24px 18px 20px",
                    border:`1px solid ${C.border}`, boxShadow:C.shadow,
                    marginBottom:16, textAlign:"center" }}>

        <AvatarUpload
          avatar={draft.avatar} name={draft.name}
          onAvatar={v => setDraft(d => ({ ...d, avatar:v }))}
        />

        {editMode ? (
          <div style={{ textAlign:"left" }}>
            <Lbl>Ism Familiya</Lbl>
            <TInput value={draft.name}    onChange={v=>setDraft(d=>({...d,name:v}))}    placeholder="Ism Familiya" />
            <Lbl>Telefon</Lbl>
            <TInput value={draft.phone}   onChange={v=>setDraft(d=>({...d,phone:v}))}   placeholder="+998 90 000 00 00" />
            <Lbl>Telegram manzil</Lbl>
            <TInput value={draft.telegram||""} onChange={v=>setDraft(d=>({...d,telegram:v}))} placeholder="@username" />
            <div style={{ display:"flex", gap:9, marginTop:4 }}>
              <BtnGhost onClick={cancel}>Bekor</BtnGhost>
              <BtnPrimary onClick={save}>✅ Saqlash</BtnPrimary>
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize:20, fontWeight:900, color:C.text, marginBottom:3 }}>{user.name}</div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:14 }}>{user.phone}</div>
            <button onClick={() => setEditMode(true)}
              style={{ padding:"8px 22px", borderRadius:20, border:`1.5px solid ${C.primaryBorder}`,
                       background:C.primaryLight, color:C.primaryDark, fontSize:12,
                       fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              ✏️ Tahrirlash
            </button>
          </>
        )}
      </div>

      {/* ── Stats row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
        {[["📦", myProducts.length, "E'lonlarim"],
          ["🗓", new Date(user.joined).getFullYear(), "A'zo yili"]].map(([ic,v,l])=>(
          <div key={l} style={{ background:C.card, borderRadius:16, padding:"14px 10px",
                                 textAlign:"center", border:`1px solid ${C.border}`, boxShadow:C.shadow }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{ic}</div>
            <div style={{ fontSize:22, fontWeight:900, color:C.primaryDark }}>{v}</div>
            <div style={{ fontSize:10, color:C.textMuted }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ── My listings ── */}
      <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:12 }}>
        📦 Mening e'lonlarim
      </div>

      {myProducts.length === 0 ? (
        <div style={{ textAlign:"center", padding:"32px 20px", color:C.textMuted,
                      background:C.card, borderRadius:16, border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:38, marginBottom:8 }}>📭</div>
          <div style={{ fontSize:13, fontWeight:700 }}>Hali e'lonlar yo'q</div>
          <div style={{ fontSize:11, marginTop:3 }}>E'lon qo'shish uchun ➕ ni bosing</div>
        </div>
      ) : (
        myProducts.map(p => {
          const cc = COND[p.condition];
          return (
            <div key={p.id}
              style={{ background:C.card, borderRadius:16, marginBottom:10,
                       border:`1px solid ${C.border}`, boxShadow:C.shadow,
                       display:"flex", overflow:"hidden", alignItems:"stretch" }}>
              {/* thumb */}
              <div style={{ width:80, flexShrink:0, background:C.primaryLight,
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                {p.photo
                  ? <img src={p.photo} alt={p.name} style={{ width:80, height:"100%", objectFit:"cover" }} />
                  : <span style={{ fontSize:28, opacity:0.3 }}>📷</span>
                }
              </div>
              {/* info */}
              <div style={{ flex:1, padding:"10px 12px", minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.text, overflow:"hidden",
                              textOverflow:"ellipsis", whiteSpace:"nowrap", marginBottom:2 }}>{p.name}</div>
                <div style={{ fontSize:12, fontWeight:700, color:C.primaryDark, marginBottom:4 }}>
                  {p.price.toLocaleString()} so'm/{p.unit}
                </div>
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:7,
                                 background:cc.bg, color:cc.text }}>● {p.condition}</span>
                  <span style={{ fontSize:9, color:C.textMuted, display:"inline-flex", alignItems:"center", gap:2 }}><LocIcon size={9} color={C.textMuted}/> {p.tuman||p.viloyat}</span>
                </div>
              </div>
              {/* delete */}
              <div style={{ display:"flex", alignItems:"center", padding:"0 12px" }}>
                <button onClick={() => onDelete(p.id)}
                  style={{ width:34, height:34, borderRadius:10, border:"none",
                           background:C.dangerLight, color:C.danger, fontSize:16,
                           cursor:"pointer", display:"flex", alignItems:"center",
                           justifyContent:"center" }}>🗑</button>
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
                 cursor:"pointer", fontFamily:"inherit" }}>
        🚪 Chiqish (Logout)
      </button>
      <div style={{ height:16 }} />
    </div>
  );
}
