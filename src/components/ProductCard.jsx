import LocIcon from "./LocIcon";
import { C, COND } from "../constants";

// ─── PRODUCT CARD ─────────────────────────────────────────────────
export default function PCard({ p, onClick, isOwn }) {
  const cc = COND[p.condition];
  return (
    <div onClick={onClick}
      style={{ background:C.card, borderRadius:18, overflow:"hidden",
               cursor:"pointer", border:`1px solid ${isOwn ? C.primaryBorder : C.border}`,
               boxShadow:C.shadow, transition:"transform 0.18s, box-shadow 0.18s",
               position:"relative" }}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow=C.shadowMd;}}
      onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=C.shadow;}}>

      {/* "Sizniki" badge */}
      {isOwn && (
        <div style={{ position:"absolute", top:8, left:8, zIndex:2,
                      background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                      color:"white", fontSize:9, fontWeight:800,
                      padding:"3px 8px", borderRadius:10,
                      boxShadow:"0 2px 8px rgba(255,179,128,0.5)" }}>
          ✏️ Sizniki
        </div>
      )}

      {/* photo */}
      <div style={{ width:"100%", height:120, background:C.primaryLight, overflow:"hidden",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    position:"relative" }}>
        {p.photo
          ? <img src={p.photo} alt={p.name}
              style={{ width:"100%", height:"100%", objectFit:"cover" }}
              onError={e => { e.target.style.display="none"; }}
            />
          : <div style={{ fontSize:48, opacity:0.3 }}>📷</div>
        }
      </div>

      <div style={{ padding:"10px 12px 12px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
          <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:8,
                         background:cc.bg, color:cc.text }}>● {p.condition}</span>
          <span style={{ fontSize:9, color:C.textMuted }}>#{p.id.slice(0,10)}...</span>
        </div>

        <div style={{ fontSize:13, fontWeight:800, color:C.text, marginBottom:6, lineHeight:1.25 }}>{p.name}</div>

        {/* Manzil — kartaning o'zida alohida va kattaroq */}
        <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:8 }}>
          <LocIcon size={11} color={C.textSub} />
          <span style={{ fontSize:11, color:C.textSub, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {p.viloyat}{p.tuman ? ` › ${p.tuman}` : ""}
          </span>
        </div>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
          <div>
            <span style={{ fontSize:14, fontWeight:900, color:C.primaryDark }}>{p.price.toLocaleString()}</span>
            <span style={{ fontSize:9, color:C.textMuted }}> so'm/{p.unit}</span>
          </div>
          <div style={{ fontSize:10, color:C.textSub, background:C.bg,
                        padding:"2px 7px", borderRadius:8, fontWeight:600 }}>
            {p.qty} {p.unit}
          </div>
        </div>
      </div>
    </div>
  );
}
