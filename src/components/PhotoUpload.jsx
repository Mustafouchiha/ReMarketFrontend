import { useRef } from "react";
import { C } from "../constants";

// ─── PHOTO UPLOAD ─────────────────────────────────────────────────
export default function PhotoUpload({ photo, onPhoto, required=false }) {
  const galleryRef = useRef();
  const cameraRef  = useRef();

  const readFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        onPhoto(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ marginBottom:18 }}>
      {/* Preview zone */}
      <div style={{
        width:"100%", height:200, borderRadius:18,
        border: photo ? "none" : `2px dashed ${required && !photo ? C.primaryDark : C.primaryBorder}`,
        background: photo ? "transparent" : C.primaryLight,
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        overflow:"hidden", marginBottom:12,
        position:"relative", cursor: photo ? "default" : "pointer",
      }}
        onClick={() => !photo && galleryRef.current?.click()}
      >
        {photo ? (
          <>
            <img src={photo} alt="mahsulot" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            {/* overlay buttons */}
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0)", display:"flex",
                          alignItems:"flex-end", justifyContent:"center", paddingBottom:12,
                          gap:8, opacity:0, transition:"opacity 0.2s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity=1}
              onMouseLeave={e=>e.currentTarget.style.opacity=0}>
              <button onClick={e=>{e.stopPropagation();galleryRef.current?.click();}}
                style={{ padding:"7px 14px", borderRadius:20, border:"none",
                         background:"rgba(255,255,255,0.92)", fontSize:11, fontWeight:700,
                         cursor:"pointer", color:C.primaryDark }}>🖼 O'zgartirish</button>
              <button onClick={e=>{e.stopPropagation();onPhoto(null);}}
                style={{ padding:"7px 14px", borderRadius:20, border:"none",
                         background:"rgba(255,255,255,0.92)", fontSize:11, fontWeight:700,
                         cursor:"pointer", color:C.danger }}>🗑 O'chirish</button>
            </div>
            {/* always visible delete on mobile */}
            <button onClick={e=>{e.stopPropagation();onPhoto(null);}}
              style={{ position:"absolute", top:10, right:10, width:30, height:30,
                       borderRadius:"50%", border:"none",
                       background:"rgba(0,0,0,0.5)", color:"white",
                       fontSize:14, cursor:"pointer", fontWeight:700,
                       display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
          </>
        ) : (
          <>
            <div style={{ fontSize:44, marginBottom:10, opacity:0.6 }}>📷</div>
            <div style={{ fontSize:13, fontWeight:700, color:C.primaryDark }}>Rasm yuklang</div>
            <div style={{ fontSize:11, color:C.textMuted, marginTop:3 }}>
              {required ? "* Rasm majburiy" : "Galeriya yoki kameradan"}
            </div>
          </>
        )}
      </div>

      {/* hidden file inputs */}
      <input ref={galleryRef} type="file" accept="image/*" onChange={readFile} style={{ display:"none" }} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={readFile} style={{ display:"none" }} />

      {/* source buttons */}
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => galleryRef.current?.click()}
          style={{ flex:1, padding:"11px 8px", borderRadius:13,
                   border:`1.5px solid ${C.primaryBorder}`,
                   background:C.primaryLight, color:C.primaryDark,
                   fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                   display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <span style={{ fontSize:16 }}>🖼</span> Galereya
        </button>
        <button onClick={() => cameraRef.current?.click()}
          style={{ flex:1, padding:"11px 8px", borderRadius:13,
                   border:`1.5px solid ${C.primaryBorder}`,
                   background:C.primaryLight, color:C.primaryDark,
                   fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                   display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
          <span style={{ fontSize:16 }}>📸</span> Kamera
        </button>
      </div>
    </div>
  );
}
