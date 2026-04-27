import { useRef } from "react";
import { C } from "../constants";
import { Camera, Image as ImageIcon, Plus, X } from "lucide-react";

const MAX = 4;

export default function PhotoUpload({ photos = [], onPhotos, required = false }) {
  const galleryRef = useRef();
  const cameraRef  = useRef();

  const readFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        const SZ = 800;
        let { width, height } = img;
        if (width > SZ || height > SZ) {
          if (width > height) { height = Math.round(height * SZ / width); width = SZ; }
          else { width = Math.round(width * SZ / height); height = SZ; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        onPhotos([...photos, canvas.toDataURL("image/jpeg", 0.7)]);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const remove = (i) => onPhotos(photos.filter((_, idx) => idx !== i));
  const canAdd  = photos.length < MAX;

  return (
    <div style={{ marginBottom: 18 }}>
      {/* Grid: photos + add slot */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "1",
                                borderRadius: 12, overflow: "hidden", background: C.primaryLight }}>
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {i === 0 && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0,
                            background: "rgba(0,0,0,0.45)", fontSize: 8, color: "white",
                            fontWeight: 700, textAlign: "center", padding: "2px 0" }}>
                Asosiy
              </div>
            )}
            <button onClick={() => remove(i)}
              style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20,
                       borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.55)",
                       color: "white", cursor: "pointer", padding: 0,
                       display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={10} />
            </button>
          </div>
        ))}

        {canAdd && (
          <div onClick={() => galleryRef.current?.click()}
            style={{ aspectRatio: "1", borderRadius: 12,
                     border: `2px dashed ${required && photos.length === 0 ? C.primaryDark : C.primaryBorder}`,
                     background: C.primaryLight, display: "flex", flexDirection: "column",
                     alignItems: "center", justifyContent: "center",
                     cursor: "pointer", gap: 4 }}>
            <Plus size={22} color={C.primaryDark} style={{ opacity: 0.6 }} />
            {photos.length === 0 && (
              <div style={{ fontSize: 9, color: C.primaryDark, fontWeight: 700,
                            textAlign: "center", padding: "0 4px" }}>
                {required ? "* Majburiy" : "Rasm"}
              </div>
            )}
          </div>
        )}
      </div>

      <input ref={galleryRef} type="file" accept="image/*" onChange={readFile} style={{ display:"none" }} />
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" onChange={readFile} style={{ display:"none" }} />

      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => galleryRef.current?.click()} disabled={!canAdd}
          style={{ flex: 1, padding: "11px 8px", borderRadius: 13,
                   border: `1.5px solid ${canAdd ? C.primaryBorder : C.border}`,
                   background: canAdd ? C.primaryLight : C.bg,
                   color: canAdd ? C.primaryDark : C.textMuted,
                   fontSize: 12, fontWeight: 700,
                   cursor: canAdd ? "pointer" : "not-allowed",
                   fontFamily: "inherit",
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <ImageIcon size={16} /> Galereya
        </button>
        <button onClick={() => cameraRef.current?.click()} disabled={!canAdd}
          style={{ flex: 1, padding: "11px 8px", borderRadius: 13,
                   border: `1.5px solid ${canAdd ? C.primaryBorder : C.border}`,
                   background: canAdd ? C.primaryLight : C.bg,
                   color: canAdd ? C.primaryDark : C.textMuted,
                   fontSize: 12, fontWeight: 700,
                   cursor: canAdd ? "pointer" : "not-allowed",
                   fontFamily: "inherit",
                   display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Camera size={16} /> Kamera
        </button>
      </div>

      {photos.length > 0 && (
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8, textAlign: "center" }}>
          {photos.length}/{MAX} ta rasm • Birinchi rasm asosiy bo'ladi
        </div>
      )}
    </div>
  );
}
