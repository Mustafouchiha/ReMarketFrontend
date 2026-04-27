import { useState, useRef } from "react";
import { C } from "../constants";
import { Pencil, Image as ImageIcon, Camera, Trash2 } from "lucide-react";

// ─── AVATAR UPLOAD ───────────────────────────────────────────────
export default function AvatarUpload({ avatar, name, onAvatar }) {
  const galleryRef = useRef();
  const cameraRef  = useRef();
  const initials = name.trim().split(/\s+/).map(w=>w[0]||"").join("").slice(0,2).toUpperCase();

  const readFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 300;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        onAvatar(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const [showMenu, setShowMenu] = useState(false);

  return (
    <div style={{ position:"relative", width:96, height:96, margin:"0 auto 16px" }}>
      {/* circle */}
      <div style={{ width:96, height:96, borderRadius:"50%", overflow:"hidden",
                    border:`3px solid ${C.primaryBorder}`,
                    background: avatar ? "transparent" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    cursor:"pointer" }}
        onClick={() => setShowMenu(m => !m)}>
        {avatar
          ? <img src={avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          : <span style={{ fontSize:30, fontWeight:900, color:"white" }}>{initials}</span>
        }
      </div>

      {/* edit badge */}
      <div onClick={() => setShowMenu(m => !m)}
        style={{ position:"absolute", bottom:2, right:2, width:28, height:28,
                 borderRadius:"50%", border:"2.5px solid white",
                 background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                 color:"white", cursor:"pointer",
                 display:"flex", alignItems:"center", justifyContent:"center",
                 boxShadow:C.shadow }}>
        <Pencil size={13} color="white" />
      </div>

      {/* mini menu */}
      {showMenu && (
        <div style={{ position:"absolute", top:106, left:"50%", transform:"translateX(-50%)",
                      background:C.card, borderRadius:14, padding:"6px 0",
                      boxShadow:C.shadowMd, border:`1px solid ${C.border}`,
                      zIndex:100, minWidth:160 }}>
          {[
            [ImageIcon,  "Galereya",   () => { galleryRef.current?.click(); setShowMenu(false); }],
            [Camera, "Kamera",     () => { cameraRef.current?.click();  setShowMenu(false); }],
            ...(avatar ? [[Trash2, "O'chirish", () => { onAvatar(null); setShowMenu(false); }]] : []),
          ].map(([Icon, lbl, fn]) => (
            <div key={lbl} onClick={fn}
              style={{ padding:"9px 14px", fontSize:12, fontWeight:700,
                       color: lbl==="O'chirish" ? C.danger : C.text,
                       cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
              <Icon size={14} color={lbl==="O'chirish" ? C.danger : C.textSub} />
              {lbl}
            </div>
          ))}
        </div>
      )}

      <input ref={galleryRef} type="file" accept="image/*" onChange={readFile} style={{ display:"none" }} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={readFile} style={{ display:"none" }} />
    </div>
  );
}
