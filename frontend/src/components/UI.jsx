import React, { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { C } from "../constants";

// ─── UI ATOMS ────────────────────────────────────────────────────
export function Lbl({ children }) {
  return <div style={{ fontSize:10, fontWeight:700, color:C.textSub, marginBottom:5, textTransform:"uppercase", letterSpacing:0.5 }}>{children}</div>;
}

export function TInput({ placeholder, value, onChange, type="text", min }) {
  const [focus, setFocus] = useState(false);
  return (
    <input type={type} placeholder={placeholder} value={value} min={min}
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
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
    }}>{children}</button>
  );
}

export function BtnGhost({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding:"12px 18px", borderRadius:13, border:`1.5px solid ${C.border}`,
      background:C.bg, fontSize:13, fontWeight:600, color:C.textSub,
      cursor:"pointer", fontFamily:"inherit",
      display:"inline-flex", alignItems:"center", justifyContent:"center", gap:7,
    }}>{children}</button>
  );
}

// Minimal height — bu dan kichik bo'lsa, yopiladi
const CLOSE_THRESHOLD = 130;

export function Sheet({ onClose, children, maxH = "92vh" }) {
  const innerRef  = useRef();
  const dragState = useRef({ dragging: false, startY: 0, startH: 0 });
  const [sheetH,  setSheetH]  = useState(null);   // null = content-auto
  const [closing, setClosing] = useState(false);
  const isDragging = useRef(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const doClose = () => {
    setClosing(true);
    setTimeout(onClose, 220);
  };

  /* ── Handle drag (touch) ── */
  const onHandleStart = (e) => {
    e.stopPropagation();
    isDragging.current = true;
    dragState.current.startY = e.touches[0].clientY;
    dragState.current.startH = innerRef.current?.offsetHeight ?? 0;
  };

  const onHandleMove = (e) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    const dy  = dragState.current.startY - e.touches[0].clientY;  // + = yuqoriga
    const maxPx = window.innerHeight * 0.95;
    const newH  = Math.max(40, Math.min(dragState.current.startH + dy, maxPx));
    setSheetH(newH);
  };

  const onHandleEnd = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (sheetH !== null && sheetH < CLOSE_THRESHOLD) {
      doClose();
    }
  };

  /* ── Handle drag (mouse, desktop uchun) ── */
  const onHandleMouseDown = (e) => {
    e.preventDefault();
    dragState.current.startY = e.clientY;
    dragState.current.startH = innerRef.current?.offsetHeight ?? 0;
    const onMove = (ev) => {
      const dy = dragState.current.startY - ev.clientY;
      const maxPx = window.innerHeight * 0.95;
      setSheetH(Math.max(40, Math.min(dragState.current.startH + dy, maxPx)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setSheetH(h => (h !== null && h < CLOSE_THRESHOLD ? (doClose(), h) : h));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // 90%+ bo'lsa — to'liq ekran (faqat balandlik, kenglik 430px da qoladi)
  const isFullscreen = sheetH !== null && sheetH >= window.innerHeight * 0.9;
  const heightStyle  = isFullscreen
    ? { height:"100dvh" }
    : sheetH !== null
      ? { height: sheetH }
      : {};

  // Fullscreen: oxirgi child (tugmalar) ni pastga yopishtiramiz
  const kids = React.Children.toArray(children);
  const renderChildren = isFullscreen && kids.length > 1
    ? kids.map((child, i) =>
        i === kids.length - 1 && React.isValidElement(child)
          ? React.cloneElement(child, {
              style: { ...(child.props?.style ?? {}), marginTop:"auto", flexShrink:0 }
            })
          : child)
    : children;

  return (
    <div onClick={doClose}
      style={{ position:"fixed", inset:0,
               background: closing ? "rgba(0,0,0,0)" : "rgba(0,0,0,0.36)",
               zIndex:60, overflowX:"hidden", overflowY: isFullscreen ? "hidden" : "auto",
               transition:"background 0.22s" }}>
      {/* Spacer — sheetni pastga siqadi */}
      <div style={{ minHeight:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
      <div ref={innerRef} onClick={e => e.stopPropagation()}
        style={{ width:"100%", maxWidth:430,
                 margin:"0 auto", background:C.card,
                 borderRadius:"24px 24px 0 0",
                 boxSizing:"border-box",
                 boxShadow:"0 -10px 40px rgba(0,0,0,0.14)",
                 position:"relative",
                 display:"flex", flexDirection:"column",
                 overflow:"hidden",
                 maxHeight: isFullscreen ? undefined : maxH,
                 transform: closing ? "translateY(100%)" : "translateY(0)",
                 transition: isDragging.current ? "none" : "transform 0.22s cubic-bezier(.32,1,.46,1)",
                 ...heightStyle }}>

        {/* Drag handle */}
        <div
          onTouchStart={onHandleStart}
          onTouchMove={onHandleMove}
          onTouchEnd={onHandleEnd}
          onMouseDown={onHandleMouseDown}
          style={{ padding:"10px 0 8px", width:"100%", cursor:"ns-resize",
                   display:"flex", justifyContent:"center", touchAction:"none",
                   flexShrink:0 }}>
          <div style={{ width:40, height:4, background:C.border, borderRadius:2 }} />
        </div>

        <button onClick={doClose}
          style={{ position:"absolute", top:14, right:14, width:30, height:30,
                   borderRadius:"50%", border:"none", background:C.bg,
                   display:"flex", alignItems:"center", justifyContent:"center",
                   cursor:"pointer", color:C.textSub, zIndex:2 }}>
          <X size={15} />
        </button>

        {/* Scrollable content area */}
        <div style={{
          flex:1,
          overflowY: isFullscreen ? "hidden" : "auto",
          overflowX:"hidden",
          padding:"0 18px 38px",
          display: isFullscreen ? "flex" : "block",
          flexDirection: isFullscreen ? "column" : undefined,
        }}>
          {renderChildren}
        </div>
      </div>
      </div>
    </div>
  );
}
