import { C } from "../constants";

// ─── STEP BAR ─────────────────────────────────────────────────────
export default function StepBar({ steps, current }) {
  return (
    <div style={{ display:"flex", gap:6, marginBottom:20 }}>
      {steps.map((s,i) => (
        <div key={s} style={{ flex:1, textAlign:"center" }}>
          <div style={{ height:4, borderRadius:2, marginBottom:4,
                        background: i+1<=current
                          ? `linear-gradient(90deg,${C.primary},${C.primaryDark})`
                          : C.border }} />
          <div style={{ fontSize:8.5, fontWeight:700,
                        color: i+1<=current ? C.primaryDark : C.textMuted }}>{s}</div>
        </div>
      ))}
    </div>
  );
}
