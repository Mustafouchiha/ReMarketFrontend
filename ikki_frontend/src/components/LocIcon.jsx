// ─── LOCATION SVG ICON ───────────────────────────────────────────
export default function LocIcon({ size=12, color="currentColor" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      style={{ display:"inline-block", verticalAlign:"middle", flexShrink:0 }}
      xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill={color} opacity="0.9"/>
      <circle cx="12" cy="9" r="2.5" fill="white"/>
    </svg>
  );
}
