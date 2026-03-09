import { useState } from "react";
import { C } from "../constants";

// ─── UI ATOMS ────────────────────────────────────────────────────
export function Lbl({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:C.textSub, marginBottom:5, textTransform:"uppercase", letterSpacing:0.5 }}>{children}</div>;
}

export function TInput({ placeholder, value, onChange, type="text" }) {
  const [focus, setFocus] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
      style={{ width:"100%", boxSizing:"border-box", padding:"10px 13px",
               borderRadius:12, border:`1.5px solid ${focus ? C.primary : C.border}`,
               fontSize:13, color:C.text, fontFamily:"inherit", outline:"none",
               marginBottom:13, background:C.bg, transition:"border-color 0.2s" }}
    />
  );
}

export function Pill({ active, onClick, children, accent=false }) {
  return (
    <button onClick={onClick} style={{
      whiteSpace:"nowrap", padding:"7px 18px", borderRadius:22,
      border:`1.5px solid ${active ? (accent ? C.accent : C.primary) : C.border}`,
      background: active
        ? (accent ? `linear-gradient(135deg,${C.accent},#3A85C8)` : `linear-gradient(135deg,${C.primary},${C.primaryDark})`)
        : C.card,
      color: active ? "white" : C.textSub,
      fontSize:12.5, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
      boxShadow: active ? `0 3px 10px ${accent?"rgba(91,164,207,0.4)":"rgba(255,179,128,0.4)"}` : "none",
      transition:"all 0.18s",
    }}>{children}</button>
  );
}

export function BtnPrimary({ onClick, children, disabled=false, fullWidth=false }) {
  return (
    <button onClick={disabled ? undefined : onClick} style={{
      width: fullWidth ? "100%" : "auto",
      padding:"12px 18px", borderRadius:13, border:"none",
      background: disabled ? C.border : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
      fontSize:13, fontWeight:700, color:"white",
      cursor: disabled ? "default" : "pointer", fontFamily:"inherit",
      boxShadow: disabled ? "none" : `0 4px 14px rgba(255,179,128,0.45)`,
      transition:"opacity 0.18s",
    }}>{children}</button>
  );
}

export function BtnGhost({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:"12px 18px", borderRadius:13, border:`1.5px solid ${C.border}`,
      background:C.bg, fontSize:13, fontWeight:600, color:C.textSub,
      cursor:"pointer", fontFamily:"inherit",
    }}>{children}</button>
  );
}

export function Sheet({ onClose, children, maxH="88vh" }) {
  return (
    <div onClick={onClose}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.36)",
               zIndex:60, display:"flex", alignItems:"flex-end" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width:"100%", maxWidth:430, margin:"0 auto", background:C.card,
                 borderRadius:"24px 24px 0 0", padding:"18px 18px 38px",
                 boxShadow:"0 -10px 40px rgba(0,0,0,0.14)",
                 maxHeight:maxH, overflowY:"auto" }}>
        <div style={{ width:38, height:4, background:C.border, borderRadius:2, margin:"0 auto 18px" }} />
        {children}
      </div>
    </div>
  );
}
