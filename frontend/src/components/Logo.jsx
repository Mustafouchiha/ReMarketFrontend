// ReMarket SVG logotipi — sayt ranglariga moslashtirilgan
// 3 ta o'q 120° aylantirilgan qayta ishlash belgisi
export default function Logo({ size = 48 }) {
  // Har bir o'q: to'rtburchak tanasi + uchburchak boshi
  // Barcha 3 ta o'q bir xil, lekin 120° va 240° aylantiriladi
  const Arrow = ({ rotate, grad }) => (
    <g transform={`rotate(${rotate} 50 50)`}>
      {/* Tana */}
      <rect x="43" y="16" width="14" height="28" rx="2" fill={`url(#${grad})`} />
      {/* Bosh (nakonechnik) */}
      <polygon points="35,44 50,58 65,44" fill={`url(#${grad})`} />
    </g>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rmA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD0A8" />
          <stop offset="100%" stopColor="#F4894A" />
        </linearGradient>
        <linearGradient id="rmB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F4894A" />
          <stop offset="100%" stopColor="#D96020" />
        </linearGradient>
        <linearGradient id="rmC" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB380" />
          <stop offset="100%" stopColor="#F4894A" />
        </linearGradient>
      </defs>

      <Arrow rotate={0}   grad="rmA" />
      <Arrow rotate={120} grad="rmB" />
      <Arrow rotate={240} grad="rmC" />
    </svg>
  );
}
