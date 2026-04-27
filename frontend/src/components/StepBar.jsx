import { Camera, Package, MapPin, CheckCircle } from "lucide-react";
import { C } from "../constants";

const STEP_ICONS = [Camera, Package, MapPin, CheckCircle];
const STEP_LABELS = ["Rasm", "Ma'lumot", "Joylashuv", "Tasdiqlash"];

// ─── STEP BAR ─────────────────────────────────────────────────────
export default function StepBar({ current }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:20 }}>
      {STEP_LABELS.map((label, i) => {
        const Icon = STEP_ICONS[i];
        const done = i + 1 <= current;
        return (
          <div key={label} style={{ flex:1, textAlign:"center" }}>
            <div style={{ height:4, borderRadius:2, marginBottom:6,
                          background: done
                            ? `linear-gradient(90deg,${C.primary},${C.primaryDark})`
                            : C.border,
                          transition:"background 0.25s" }} />
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:2 }}>
              <Icon size={11} color={done ? C.primaryDark : C.textMuted} />
              <div style={{ fontSize:8.5, fontWeight:700,
                            color: done ? C.primaryDark : C.textMuted }}>{label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
